import beaker
import pyteal as pt

from smart_contracts.helpers.deployment_standard import (
    deploy_time_permanence_control,
)


class VotingState:
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
    quorum = beaker.GlobalStateValue(
        pt.TealType.uint64,
        static=True,
        descr="The minimum number of voters to reach quorum.",
    )


app = beaker.Application("VotingRoundApp", state=VotingState).apply(deploy_time_permanence_control)


@app.create()
def create(
    snapshot_public_key: pt.abi.DynamicBytes,
    metadata_ipfs_cid: pt.abi.String,
    start_time: pt.abi.Uint64,
    end_time: pt.abi.Uint64,
    quorum: pt.abi.Uint64,
) -> pt.Expr:
    return pt.Seq(
        app.state.snapshot_public_key.set(snapshot_public_key.get()),
        app.state.metadata_ipfs_cid.set(metadata_ipfs_cid.get()),
        app.state.start_time.set(start_time.get()),
        app.state.end_time.set(end_time.get()),
        app.state.quorum.set(quorum.get()),
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
        pt.Ge(pt.Global.latest_timestamp(), app.state.start_time.get()),
        pt.Lt(pt.Global.latest_timestamp(), app.state.end_time.get()),
    )


@pt.Subroutine(pt.TealType.uint64)
def already_voted() -> pt.Expr:
    # Todo: actually implement this
    return pt.BytesEq(pt.Txn.sender(), pt.Global.creator_address())


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


@app.external(read_only=True)
def vote(signature: pt.abi.DynamicBytes) -> pt.Expr:
    return pt.Seq(
        pt.Assert(allowed_to_vote(signature.get()), voting_open(), already_voted()),
    )
