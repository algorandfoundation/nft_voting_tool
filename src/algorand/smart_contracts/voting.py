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


app = (
    beaker.Application("VotingRoundApp", state=VotingState)
    .apply(deploy_time_immutability_control)
    .apply(deploy_time_permanence_control)
)


@app.create()
def create(snapshot_public_key: pt.abi.DynamicBytes) -> pt.Expr:
    return pt.Seq(app.state.snapshot_public_key.set(snapshot_public_key.get()))


@app.external(read_only=True)
def verify(signature: pt.abi.DynamicBytes, *, output: pt.abi.String) -> pt.Expr:
    opup = pt.OpUp(pt.OpUpMode.OnCall)
    return pt.Seq(
        opup.ensure_budget(pt.Int(2000)),
        pt.If(
            pt.Ed25519Verify_Bare(
                pt.Txn.sender(),
                signature.get(),
                app.state.snapshot_public_key.get(),
            )
        )
        .Then(output.set("Allowed"))
        .Else(output.set("Not allowed!")),
    )
