import beaker
import pyteal as pt

from smart_contracts.helpers.deployment_standard import (
    deploy_time_immutability_control,
    deploy_time_permanence_control,
)


class VotingState:
    snapshot_public_key = beaker.GlobalStateValue(
        pt.TealType.bytes,
        static=True,
        descr="The public key of the Ed25519 private key that was used to encrypt entries in the vote gating snapshot.",
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


app = (
    beaker.Application("VotingRoundApp", state=VotingState)
    .apply(deploy_time_immutability_control)
    .apply(deploy_time_permanence_control)
)


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
    return pt.Ed25519Verify_Bare(
        pt.Txn.sender(),
        signature,
        app.state.snapshot_public_key.get(),
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


@app.external(read_only=True)
def is_voting_open(*, output: pt.abi.Uint64) -> pt.Expr:
    return output.set(voting_open())


@app.external(read_only=True)
def is_allowed_to_vote(signature: pt.abi.DynamicBytes, *, output: pt.abi.Uint64) -> pt.Expr:
    return output.set(allowed_to_vote(signature.get()))


@app.external(read_only=True)
def has_already_voted(*, output: pt.abi.Uint64) -> pt.Expr:
    return output.set(already_voted())


# Actions


@app.external(read_only=True)
def vote(signature: pt.abi.DynamicBytes) -> pt.Expr:
    opup = pt.OpUp(pt.OpUpMode.OnCall)
    return pt.Seq(
        opup.ensure_budget(pt.Int(2000), fee_source=pt.OpUpFeeSource.GroupCredit),
        pt.Assert(allowed_to_vote(signature.get()), voting_open(), already_voted()),
    )
