from typing import Literal, TypeAlias

import beaker
import beaker.lib.storage as storage
import pyteal as pt
from pyteal.types import require_type

from smart_contracts.helpers.deployment_standard import deploy_time_permanence_control

VoteIndexBytes: TypeAlias = Literal[8]
VoteIndex: TypeAlias = pt.abi.Uint8
VoteCount: TypeAlias = pt.abi.Uint64
VoteIndexArray: TypeAlias = pt.abi.DynamicArray[VoteIndex]


class UInt64ScratchVar(pt.ScratchVar):
    def __int__(self) -> None:
        super().__init__(pt.TealType.uint64)


class StringScratchVar(pt.ScratchVar):
    def __int__(self) -> None:
        super().__init__(pt.TealType.bytes)


ZERO = pt.Int(0)
ONE = pt.Int(1)


def ForRange(  # noqa: N802
    idx: pt.ScratchVar,
    *,
    start: pt.Expr = ZERO,
    stop: pt.ScratchVar,
    step: pt.Expr = ONE,
) -> pt.For:
    return pt.For(
        idx.store(start),
        idx.load() < stop.load(),
        idx.store(idx.load() + step),
    )


class TallyBox:
    def __init__(self, key: pt.Expr, vote_type: pt.abi.Uint):
        require_type(key, pt.TealType.bytes)
        self.key = key
        self.element_size = pt.Int(vote_type.type_spec().byte_length_static())

    @property
    def exists(self) -> pt.Expr:
        return pt.Seq(maybe := pt.BoxLen(self.key), maybe.hasValue())

    def create(self, total_options_count: pt.Expr) -> pt.Expr:
        # note the box contents should be zero after this, corresponding to zero votes
        return pt.Pop(
            pt.BoxCreate(
                self.key,
                total_options_count * self.element_size,
            )
        )

    def get_vote(self, index: pt.Expr, into: UInt64ScratchVar) -> pt.Expr:
        return pt.Seq(
            (offset := UInt64ScratchVar()).store(self.element_size * index),
            into.store(
                pt.Btoi(
                    pt.BoxExtract(
                        self.key,
                        offset.load(),
                        self.element_size,
                    )
                )
            ),
        )

    def increment_vote(self, index: pt.Expr) -> pt.Expr:
        return pt.Seq(
            (offset := UInt64ScratchVar()).store(self.element_size * index),
            # load the current value from the tally box
            (current_vote_tally := UInt64ScratchVar()).store(
                pt.Btoi(
                    pt.BoxExtract(
                        self.key,
                        offset.load(),
                        self.element_size,
                    )
                )
            ),
            # increment and store the tally
            pt.BoxReplace(
                self.key,
                offset.load(),
                pt.Itob(current_vote_tally.load() + ONE),
            ),
        )


class VotingState:
    vote_id = beaker.GlobalStateValue(
        pt.TealType.bytes,
        static=True,
        descr="The identifier of this voting round",
    )
    snapshot_public_key = beaker.GlobalStateValue(
        pt.TealType.bytes,
        static=True,
        descr="The public key of the Ed25519 compatible private key "
        "that was used to encrypt entries in the vote gating snapshot",
    )
    metadata_ipfs_cid = beaker.GlobalStateValue(
        pt.TealType.bytes,
        static=True,
        descr="The IPFS content ID of the voting metadata file",
    )
    start_time = beaker.GlobalStateValue(
        pt.TealType.uint64,
        static=True,
        descr="The unix timestamp of the starting time of voting",
    )
    end_time = beaker.GlobalStateValue(
        pt.TealType.uint64,
        static=True,
        descr="The unix timestamp of the ending time of voting",
    )
    close_time = beaker.GlobalStateValue(
        pt.TealType.uint64,
        descr="The unix timestamp of the time the vote was closed",
    )
    quorum = beaker.GlobalStateValue(
        pt.TealType.uint64,
        static=True,
        descr="The minimum number of voters to reach quorum",
    )
    voter_count = beaker.GlobalStateValue(
        pt.TealType.uint64,
        descr="The minimum number of voters who have voted",
    )
    is_bootstrapped = beaker.GlobalStateValue(
        pt.TealType.uint64,
        descr="Whether or not the contract has been bootstrapped with answers",
    )
    nft_image_url = beaker.GlobalStateValue(
        pt.TealType.bytes,
        static=True,
        descr="The IPFS URL of the default image to use as the media of the result NFT",
    )
    nft_asset_id = beaker.GlobalStateValue(
        pt.TealType.uint64,
        descr="The asset ID of a result NFT if one has been created",
    )
    total_options = beaker.GlobalStateValue(
        pt.TealType.uint64, static=True, descr="The total number of options"
    )
    option_counts = beaker.GlobalStateValue(
        pt.TealType.bytes, static=True, descr="The number of options for each question"
    )
    tallies = TallyBox(key=pt.Bytes("V"), vote_type=VoteCount())

    votes = storage.BoxMapping(
        key_type=pt.abi.Address, value_type=pt.abi.StaticBytes[VoteIndexBytes]
    )

    def load_option_counts(self, into: VoteIndexArray) -> pt.Expr:
        return into.decode(self.option_counts)

    def store_option_counts(self, data: VoteIndexArray) -> pt.Expr:
        return pt.Seq(
            pt.Assert(
                data.length(),
                comment="option_counts should be non-empty",
            ),
            # option_counts won't fit with ABI encoding if length is > 112
            pt.Assert(
                data.length() <= pt.Int(112),
                comment="Can't have more than 112 questions",
            ),
            self.option_counts.set(data.encode()),
            (total_options := UInt64ScratchVar()).store(
                self.calculate_total_options_count()
            ),
            # Need to have a reasonable limit, plus this ensures the results should fit
            # into the 1000 byte limit for the transaction note of the result NFT and
            # the 128 byte limit for global storage
            pt.Assert(
                total_options.load() <= pt.Int(128),
                comment="Can't have more than 128 vote options",
            ),
            self.total_options.set(total_options.load()),
        )

    def calculate_total_options_count(self) -> pt.Expr:
        return pt.Seq(
            self.load_option_counts(
                into=(option_counts := pt.abi.make(VoteIndexArray))
            ),
            pt.Seq(
                (total := UInt64ScratchVar()).store(ZERO),
                (questions_count := UInt64ScratchVar()).store(option_counts.length()),
                ForRange(question_idx := UInt64ScratchVar(), stop=questions_count).Do(
                    option_counts[question_idx.load()].use(
                        lambda count: total.store(total.load() + count.get())
                    )
                ),
                total.load(),
            ),
        )


app = beaker.Application("VotingRoundApp", state=VotingState()).apply(
    # Disallow a voting round app to be deleted in MainNet
    # but allow deletion during local development
    deploy_time_permanence_control
)


@app.create()
def create(
    vote_id: pt.abi.String,
    snapshot_public_key: pt.abi.DynamicBytes,
    metadata_ipfs_cid: pt.abi.String,
    start_time: pt.abi.Uint64,
    end_time: pt.abi.Uint64,
    option_counts: VoteIndexArray,
    quorum: pt.abi.Uint64,
    nft_image_url: pt.abi.String,
) -> pt.Expr:
    opup = pt.OpUp(pt.OpUpMode.OnCall)
    return pt.Seq(
        # store_option_counts when there is a max # of options needs ~2600 budget
        opup.ensure_budget(pt.Int(2800), fee_source=pt.OpUpFeeSource.GroupCredit),
        pt.Assert(
            # Technically this should be < but having <= makes automated testing easier
            # since it's not possible to control time yet
            start_time.get() <= end_time.get(),
            comment="End time should be after start time",
        ),
        pt.Assert(
            end_time.get() >= pt.Global.latest_timestamp(),
            comment="End time should be in the future",
        ),
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
        app.state.store_option_counts(option_counts),
    )


@app.external(authorize=beaker.Authorize.only_creator())
def bootstrap(
    fund_min_bal_req: pt.abi.PaymentTransaction,
) -> pt.Expr:
    pt.ScratchVar(pt.TealType.uint64)
    min_bal_req = pt.ScratchVar(pt.TealType.uint64)
    return pt.Seq(
        pt.Assert(
            pt.Not(app.state.is_bootstrapped.get()), comment="Already bootstrapped"
        ),
        app.state.is_bootstrapped.set(pt.Int(1)),
        min_bal_req.store(
            pt.Int(
                # minimum balance req for: ALGOs + Vote result NFT asset
                beaker.consts.ASSET_MIN_BALANCE * 2
                #  Create NFT fee
                + 1000
                # Tally box
                + beaker.consts.BOX_FLAT_MIN_BALANCE
                # Tally box key "V"
                + beaker.consts.BOX_BYTE_MIN_BALANCE
            )
            + (
                # Tally box value
                app.state.total_options.get()
                * (
                    pt.Int(
                        pt.abi.make(VoteCount).type_spec().byte_length_static()
                        * beaker.consts.BOX_BYTE_MIN_BALANCE
                    )
                )
            )
        ),
        pt.Assert(
            fund_min_bal_req.get().receiver()
            == pt.Global.current_application_address(),
            comment="Payment must be to app address",
        ),
        pt.Assert(
            fund_min_bal_req.get().amount() >= min_bal_req.load(),
            comment="Payment must be for >= min balance requirement",
        ),
        app.state.tallies.create(app.state.total_options.get()),
    )


@app.external(authorize=beaker.Authorize.only_creator())
def close() -> pt.Expr:
    opup = pt.OpUp(pt.OpUpMode.OnCall)
    return pt.Seq(
        opup.ensure_budget(pt.Int(20000), fee_source=pt.OpUpFeeSource.GroupCredit),
        pt.Assert(app.state.close_time == pt.Int(0), comment="Already closed"),
        app.state.close_time.set(pt.Global.latest_timestamp()),
        (note := StringScratchVar()).store(
            pt.Concat(
                pt.Bytes(
                    '{"standard":"arc69","description":"This is a voting result NFT'
                    " for voting round with ID "
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
                pt.Bytes(',"tallies":['),
            )
        ),
        app.state.load_option_counts(
            into=(option_counts := pt.abi.make(VoteIndexArray))
        ),
        (questions_count := UInt64ScratchVar()).store(option_counts.length()),
        (current_tally := UInt64ScratchVar()).store(ZERO),
        (current_index := UInt64ScratchVar()).store(ZERO),
        ForRange(question_index := UInt64ScratchVar(), stop=questions_count).Do(
            # Load the number of vote options for this question
            option_counts[question_index.load()].store_into(
                options_count_temp := VoteIndex()
            ),
            (options_count := UInt64ScratchVar()).store(options_count_temp.get()),
            ForRange(option_index := UInt64ScratchVar(), stop=options_count).Do(
                app.state.tallies.get_vote(current_index.load(), current_tally),
                note.store(
                    pt.Concat(
                        note.load(),
                        pt.If(option_index.load() == ZERO, pt.Bytes("["), pt.Bytes("")),
                        itoa(current_tally.load()),
                        pt.If(
                            option_index.load() == (options_count.load() - ONE),
                            pt.Concat(
                                pt.Bytes("]"),
                                pt.If(
                                    question_index.load()
                                    == (questions_count.load() - ONE),
                                    pt.Bytes(""),
                                    pt.Bytes(","),
                                ),
                            ),
                            pt.Bytes(","),
                        ),
                    )
                ),
                current_index.store(current_index.load() + ONE),
            ),
        ),
        pt.InnerTxnBuilder.Execute(
            {
                pt.TxnField.type_enum: pt.TxnType.AssetConfig,
                pt.TxnField.config_asset_total: pt.Int(1),
                pt.TxnField.config_asset_decimals: pt.Int(0),
                pt.TxnField.config_asset_default_frozen: pt.Int(0),
                pt.TxnField.config_asset_name: pt.Concat(
                    pt.Bytes("[VOTE RESULT] "), app.state.vote_id.get()
                ),
                pt.TxnField.config_asset_unit_name: pt.Bytes("VOTERSLT"),
                pt.TxnField.config_asset_url: app.state.nft_image_url.get(),
                pt.TxnField.note: pt.Concat(note.load(), pt.Bytes("]}}")),
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
        pt.Global.latest_timestamp() >= app.state.start_time,
        pt.Global.latest_timestamp() < app.state.end_time,
    )


@pt.Subroutine(pt.TealType.uint64)
def already_voted() -> pt.Expr:
    return pt.Seq(
        (voter := pt.abi.Address()).set(pt.Txn.sender()),
        app.state.votes[voter].exists(),
    )


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
def get_preconditions(
    signature: pt.abi.DynamicBytes, *, output: VotingPreconditions
) -> pt.Expr:
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
    answer_ids: VoteIndexArray,
) -> pt.Expr:
    opup = pt.OpUp(pt.OpUpMode.OnCall)
    return pt.Seq(
        opup.ensure_budget(pt.Int(7700), fee_source=pt.OpUpFeeSource.GroupCredit),
        # Check voting preconditions
        pt.Assert(allowed_to_vote(signature.get()), comment="Not allowed to vote"),
        pt.Assert(voting_open(), comment="Voting not open"),
        pt.Assert(pt.Not(already_voted()), comment="Already voted"),
        # Check vote array looks valid
        app.state.load_option_counts(
            into=(option_counts := pt.abi.make(VoteIndexArray))
        ),
        (questions_count := UInt64ScratchVar()).store(option_counts.length()),
        pt.Assert(
            answer_ids.length() == questions_count.load(),
            comment="Number of answers incorrect",
        ),
        # Check voter box is funded
        (min_bal_req := UInt64ScratchVar()).store(
            pt.Int(beaker.consts.BOX_FLAT_MIN_BALANCE)
            + (
                pt.Int(32)
                + pt.Int(VoteIndex().type_spec().byte_length_static())
                * answer_ids.length()
            )
            * pt.Int(beaker.consts.BOX_BYTE_MIN_BALANCE)
        ),
        pt.Assert(
            fund_min_bal_req.get().receiver()
            == pt.Global.current_application_address(),
            comment="Payment must be to app address",
        ),
        pt.Assert(
            fund_min_bal_req.get().amount() >= min_bal_req.load(),
            comment="Payment must be for >= min balance requirement",
        ),
        # Record the vote for each question
        (cumulative_offset := UInt64ScratchVar()).store(ZERO),
        ForRange(question_index := UInt64ScratchVar(), stop=questions_count).Do(
            # Load the user's vote for this question
            answer_ids[question_index.load()].store_into(
                answer_option_index := VoteIndex()
            ),
            # Load the number of vote options for this question
            option_counts[question_index.load()].store_into(
                options_count := VoteIndex()
            ),
            pt.Assert(
                answer_option_index.get() < options_count.get(),
                comment="Answer option index invalid",
            ),
            # Increment the tally: the index into the tally is the cumulative option
            # count from all the questions so far + the vote option for this question
            app.state.tallies.increment_vote(
                index=cumulative_offset.load() + answer_option_index.get()
            ),
            # compute offset for start of next question
            cumulative_offset.store(cumulative_offset.load() + options_count.get()),
        ),
        (voter := pt.abi.Address()).set(pt.Txn.sender()),
        app.state.votes[voter].set(answer_ids.encode()),
        app.state.voter_count.set(app.state.voter_count.get() + ONE),
    )
