import beaker
import pyteal as pt
import beaker.lib.storage as storage
from typing import Literal

from smart_contracts.helpers.deployment_standard import (
    deploy_time_permanence_control,
)


class VotingState:
    vote_id = beaker.GlobalStateValue(
        pt.TealType.bytes,
        static=True,
        descr="The identifier of this voting round.",
    )
    snapshot_public_key = beaker.GlobalStateValue(
        pt.TealType.bytes,
        static=True,
        descr="The public key of the Ed25519 compatible private key that was used to encrypt entries in the vote gating snapshot.",
    )
    metadata_ipfs_cid = beaker.GlobalStateValue(
        pt.TealType.bytes,
        static=True,
        descr="The IPFS content ID of the voting metadata file.",
    )
    start_time = beaker.GlobalStateValue(
        pt.TealType.uint64,
        static=True,
        descr="The unix timestamp of the starting time of voting.",
    )
    end_time = beaker.GlobalStateValue(
        pt.TealType.uint64,
        static=True,
        descr="The unix timestamp of the ending time of voting.",
    )
    close_time = beaker.GlobalStateValue(
        pt.TealType.uint64,
        descr="The unix timestamp of the time the vote was closed.",
    )
    quorum = beaker.GlobalStateValue(
        pt.TealType.uint64,
        static=True,
        descr="The minimum number of voters to reach quorum.",
    )
    voter_count = beaker.GlobalStateValue(
        pt.TealType.uint64,
        descr="The minimum number of voters who have voted.",
    )
    is_bootstrapped = beaker.GlobalStateValue(
        pt.TealType.uint64, descr="Whether or not the contract has been bootstrapped with answers"
    )
    nft_image_url = beaker.GlobalStateValue(
        pt.TealType.bytes,
        static=True,
        descr="The IPFS URL of the default image to use as the media of the result NFT.",
    )
    nft_asset_id = beaker.GlobalStateValue(
        pt.TealType.uint64,
        descr="The asset ID of a result NFT if one has been created.",
    )
    tallies = storage.BoxMapping(
        # 18 = 16 bytes question ID key (GUID value) + 2 bytes prefix ("V_")
        key_type=pt.abi.StaticBytes[Literal[18]],
        value_type=pt.abi.Uint64,
        prefix=pt.Bytes("V_"),
    )
    votes = storage.BoxMapping(key_type=pt.abi.Address, value_type=pt.abi.StaticBytes[Literal[16]])


app = beaker.Application("VotingRoundApp", state=VotingState).apply(deploy_time_permanence_control)


@app.create()
def create(
    vote_id: pt.abi.String,
    snapshot_public_key: pt.abi.DynamicBytes,
    metadata_ipfs_cid: pt.abi.String,
    start_time: pt.abi.Uint64,
    end_time: pt.abi.Uint64,
    quorum: pt.abi.Uint64,
    nft_image_url: pt.abi.String,
) -> pt.Expr:
    return pt.Seq(
        app.state.vote_id.set(vote_id.get()),
        app.state.snapshot_public_key.set(snapshot_public_key.get()),
        app.state.metadata_ipfs_cid.set(metadata_ipfs_cid.get()),
        app.state.start_time.set(start_time.get()),
        app.state.end_time.set(end_time.get()),
        app.state.quorum.set(quorum.get()),
        app.state.is_bootstrapped.set(pt.Int(0)),
        app.state.voter_count.set(pt.Int(0)),
        app.state.close_time.set(pt.Int(0)),
        app.state.nft_image_url.set(nft_image_url.get()),
        app.state.nft_asset_id.set(pt.Int(0)),
    )


@app.external(authorize=beaker.Authorize.only_creator())
def bootstrap(
    fund_min_bal_req: pt.abi.PaymentTransaction,
    answers: pt.abi.DynamicArray[pt.abi.StaticBytes[Literal[16]]],
) -> pt.Expr:
    i = pt.ScratchVar(pt.TealType.uint64)
    min_bal_req = pt.ScratchVar(pt.TealType.uint64)
    return pt.Seq(
        pt.Assert(pt.Not(app.state.is_bootstrapped.get()), comment="Already bootstrapped"),
        app.state.is_bootstrapped.set(pt.Int(1)),
        min_bal_req.store(
            pt.Int(
                beaker.consts.ASSET_MIN_BALANCE * 2 + 1000
            )  # minimum balance req for: ALGOs + Vote result NFT asset + txn fee for creating NFT
            + (
                answers.length()
                * (
                    pt.Int(beaker.consts.BOX_FLAT_MIN_BALANCE)
                    + pt.Int(18 + 8) * pt.Int(beaker.consts.BOX_BYTE_MIN_BALANCE)
                )
            )
        ),
        pt.Assert(
            fund_min_bal_req.get().receiver() == pt.Global.current_application_address(),
            comment="Payment must be to app address",
        ),
        pt.Assert(
            fund_min_bal_req.get().amount() >= min_bal_req.load(),
            comment="Payment must be for >= min balance requirement",
        ),
        pt.For(i.store(pt.Int(0)), i.load() < answers.length(), i.store(i.load() + pt.Int(1))).Do(
            answers[i.load()].use(lambda answer: app.state.tallies[answer.get()].set(pt.Itob(pt.Int(0))))
        ),
    )


@app.external(authorize=beaker.Authorize.only_creator())
def close() -> pt.Expr:
    return pt.Seq(
        pt.Assert(app.state.close_time == pt.Int(0), comment="Already closed"),
        app.state.close_time.set(pt.Global.latest_timestamp()),
        pt.InnerTxnBuilder.Execute(
            {
                pt.TxnField.type_enum: pt.TxnType.AssetConfig,
                pt.TxnField.config_asset_total: pt.Int(1),
                pt.TxnField.config_asset_decimals: pt.Int(0),
                pt.TxnField.config_asset_default_frozen: pt.Int(0),
                pt.TxnField.config_asset_name: pt.Concat(pt.Bytes("[VOTE RESULT] "), app.state.vote_id.get()),
                pt.TxnField.config_asset_unit_name: pt.Bytes("VOTERSLT"),
                pt.TxnField.config_asset_url: app.state.nft_image_url.get(),
                pt.TxnField.note: pt.Concat(
                    pt.Bytes(
                        '{"standard":"arc69","description":"This is a voting result NFT for voting round with ID '
                    ),
                    app.state.vote_id.get(),
                    pt.Bytes('.","properties":{"metadata":"ipfs://'),
                    app.state.metadata_ipfs_cid.get(),
                    pt.Bytes('","id":"'),
                    app.state.vote_id.get(),
                    pt.Bytes('","quorum":'),
                    itoa(app.state.quorum.get()),
                    pt.Bytes(',"voterCount":'),
                    itoa(app.state.voter_count.get()),
                    pt.Bytes("}"),
                    # Wait for new tally design to add tally's
                    # Add dates?
                    pt.Bytes("}"),
                ),
            }
        ),
        app.state.nft_asset_id.set(pt.InnerTxn.created_asset_id()),
    )


# Helpers


@pt.Subroutine(pt.TealType.uint64)
def allowed_to_vote(signature: pt.Expr) -> pt.Expr:
    opup = pt.OpUp(pt.OpUpMode.OnCall)
    return pt.Seq(
        opup.ensure_budget(pt.Int(2000), fee_source=pt.OpUpFeeSource.GroupCredit),
        pt.Ed25519Verify_Bare(
            pt.Txn.sender(),
            signature,
            app.state.snapshot_public_key.get(),
        ),
    )


@pt.Subroutine(pt.TealType.uint64)
def voting_open() -> pt.Expr:
    return pt.And(
        pt.Eq(app.state.is_bootstrapped.get(), pt.Int(1)),
        pt.Eq(app.state.close_time.get(), pt.Int(0)),
        pt.Ge(pt.Global.latest_timestamp(), app.state.start_time.get()),
        pt.Lt(pt.Global.latest_timestamp(), app.state.end_time.get()),
    )


@pt.Subroutine(pt.TealType.uint64)
def already_voted() -> pt.Expr:
    return pt.Seq((voter := pt.abi.Address()).set(pt.Txn.sender()), app.state.votes[voter].exists())


# https://github.com/algorand/pyteal-utils/blob/main/pytealutils/strings/string.py#L63
@pt.Subroutine(pt.TealType.bytes)
def itoa(i: pt.Expr) -> pt.Expr:
    """itoa converts an integer to the ascii byte string it represents"""
    return pt.If(
        i == pt.Int(0),
        pt.Bytes("0"),
        pt.Concat(
            pt.If(i / pt.Int(10) > pt.Int(0), itoa(i / pt.Int(10)), pt.Bytes("")),
            pt.Extract(pt.Bytes("0123456789"), i % pt.Int(10), pt.Int(1)),
        ),
    )


# Readonly data methods


class VotingPreconditions(pt.abi.NamedTuple):
    is_voting_open: pt.abi.Field[pt.abi.Uint64]
    is_allowed_to_vote: pt.abi.Field[pt.abi.Uint64]
    has_already_voted: pt.abi.Field[pt.abi.Uint64]
    current_time: pt.abi.Field[pt.abi.Uint64]


@app.external(read_only=True)
def get_preconditions(signature: pt.abi.DynamicBytes, *, output: VotingPreconditions) -> pt.Expr:
    return pt.Seq(
        (is_voting_open := pt.abi.Uint64()).set(voting_open()),
        (is_allowed_to_vote := pt.abi.Uint64()).set(allowed_to_vote(signature.get())),
        (has_already_voted := pt.abi.Uint64()).set(already_voted()),
        (current_time := pt.abi.Uint64()).set(pt.Global.latest_timestamp()),
        output.set(is_voting_open, is_allowed_to_vote, has_already_voted, current_time),
    )


# Actions


@app.external()
def vote(
    fund_min_bal_req: pt.abi.PaymentTransaction,
    signature: pt.abi.DynamicBytes,
    answer_id: pt.abi.StaticBytes[Literal[16]],
) -> pt.Expr:
    tally_box = app.state.tallies[answer_id.get()]
    currentVoteTally = pt.ScratchVar(pt.TealType.uint64)
    newVoteTally = pt.ScratchVar(pt.TealType.uint64)
    min_bal_req = pt.Int(beaker.consts.BOX_FLAT_MIN_BALANCE + (16 + 32) * beaker.consts.BOX_BYTE_MIN_BALANCE)

    return pt.Seq(
        pt.Assert(allowed_to_vote(signature.get()), comment="Allowed to vote"),
        pt.Assert(voting_open(), comment="Voting open"),
        pt.Assert(pt.Not(already_voted()), comment="Hasn't already voted"),
        pt.Assert(tally_box.exists(), comment="Answer ID valid"),
        pt.Assert(
            fund_min_bal_req.get().receiver() == pt.Global.current_application_address(),
            comment="Payment must be to app address",
        ),
        pt.Assert(
            fund_min_bal_req.get().amount() >= min_bal_req,
            comment="Payment must be for >= min balance requirement",
        ),
        currentVoteTally.store(pt.Btoi(tally_box.get())),
        newVoteTally.store(pt.Add(currentVoteTally.load(), pt.Int(1))),
        pt.Assert(pt.Ge(currentVoteTally.load(), pt.Int(0)), comment="currentVoteTally >= 0"),
        pt.Assert(pt.Gt(newVoteTally.load(), currentVoteTally.load()), comment="newVoteTally > currentVoteTally"),
        tally_box.set(pt.Itob(newVoteTally.load())),
        (voter := pt.abi.Address()).set(pt.Txn.sender()),
        app.state.votes[voter].set(answer_id.get()),
        app.state.voter_count.set(app.state.voter_count.get() + pt.Int(1)),
    )
