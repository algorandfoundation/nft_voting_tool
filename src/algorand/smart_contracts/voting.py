from typing import TypeAlias

import beaker
import pyteal as pt
from pyteal.types import require_type

from smart_contracts.helpers.deployment_standard import deploy_time_permanence_control

VoteId: TypeAlias = pt.abi.Uint8
VoteCount: TypeAlias = pt.abi.Uint64
VoteIdArray: TypeAlias = pt.abi.DynamicArray[VoteId]


class UInt64ScratchVar(pt.ScratchVar):
    def __int__(self) -> None:
        super().__init__(pt.TealType.uint64)


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
    snapshot_public_key = beaker.GlobalStateValue(
        pt.TealType.bytes,
        static=True,
        descr="The public key of the Ed25519 compatible private key "
        "that was used to encrypt entries in the vote gating snapshot.",
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
    option_counts = beaker.GlobalStateValue(
        pt.TealType.bytes, static=True, descr="The number of vote options"
    )
    tally = TallyBox(key=pt.Bytes("V"), vote_type=VoteCount())

    def load_option_counts(self, into: VoteIdArray) -> pt.Expr:
        return into.decode(self.option_counts)

    def store_option_counts(self, data: VoteIdArray) -> pt.Expr:
        return pt.Seq(
            pt.Assert(
                data.length(),
                comment="option_counts should be non-empty",
            ),
            self.option_counts.set(data.encode()),
        )

    @property
    def total_options_count(self) -> pt.Expr:
        return pt.Seq(
            self.load_option_counts(into=(option_counts := pt.abi.make(VoteIdArray))),
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


app = (
    beaker.Application("VotingRoundApp", state=VotingState())
    # ability to prevent deletes in production
    .apply(deploy_time_permanence_control)
)


@app.create()
def create(
    snapshot_public_key: pt.abi.DynamicBytes,
    metadata_ipfs_cid: pt.abi.String,
    start_time: pt.abi.Uint64,
    end_time: pt.abi.Uint64,
    option_counts: VoteIdArray,
    quorum: VoteCount,
) -> pt.Expr:
    return pt.Seq(
        pt.Assert(
            start_time.get() < end_time.get(),
            comment="End time should be after start time",
        ),
        pt.Assert(
            end_time.get() > pt.Global.latest_timestamp(),
            comment="End time should be in the future",
        ),
        app.state.snapshot_public_key.set(snapshot_public_key.get()),
        app.state.metadata_ipfs_cid.set(metadata_ipfs_cid.get()),
        app.state.start_time.set(start_time.get()),
        app.state.end_time.set(end_time.get()),
        app.state.quorum.set(quorum.get()),
        app.state.store_option_counts(option_counts),
    )


@app.external(authorize=beaker.Authorize.only_creator())
def bootstrap() -> pt.Expr:
    return pt.Seq(
        # technically this isn't required as the call to `box_create`
        # should be idempotent, but it prevents accidentally funding
        # this contract multiple times which would be unrecoverable
        pt.Assert(
            pt.Not(app.state.tally.exists),
            comment="Already bootstrapped",
        ),
        app.state.tally.create(app.state.total_options_count),
    )


# ~~ Helpers ~~#


@pt.Subroutine(pt.TealType.uint64)
def allowed_to_vote(signature: pt.Expr) -> pt.Expr:
    opup = pt.OpUp(pt.OpUpMode.OnCall)
    return pt.Seq(
        opup.ensure_budget(pt.Int(2800), fee_source=pt.OpUpFeeSource.GroupCredit),
        pt.Ed25519Verify_Bare(
            pt.Txn.sender(),
            signature,
            app.state.snapshot_public_key.get(),
        ),
    )


@pt.Subroutine(pt.TealType.uint64)
def voting_open() -> pt.Expr:
    return pt.And(
        app.state.tally.exists,
        pt.Global.latest_timestamp() >= app.state.start_time,
        pt.Global.latest_timestamp() < app.state.end_time,
    )


@pt.Subroutine(pt.TealType.uint64)
def already_voted() -> pt.Expr:
    # Todo: actually implement this
    return pt.BytesEq(pt.Txn.sender(), pt.Global.creator_address())


# ~~ Readonly data methods ~~#


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


# ~~ Actions ~~#


@app.external
def vote(signature: pt.abi.DynamicBytes, answer_ids: VoteIdArray) -> pt.Expr:
    return pt.Seq(
        pt.Assert(
            allowed_to_vote(signature.get()),
            comment="Not allowed to vote",
        ),
        pt.Assert(
            voting_open(),
            comment="Voting not open",
        ),
        pt.Assert(
            pt.Not(already_voted()),
            comment="Already voted",
        ),
        app.state.load_option_counts(into=(option_counts := pt.abi.make(VoteIdArray))),
        (questions_count := UInt64ScratchVar()).store(option_counts.length()),
        pt.Assert(
            answer_ids.length() == questions_count.load(),
            comment="Number of answers incorrect",
        ),
        (cumulative_offset := UInt64ScratchVar()).store(ZERO),
        ForRange(question_idx := UInt64ScratchVar(), stop=questions_count).Do(
            # load the users vote for this question
            answer_ids[question_idx.load()].store_into(answer_id := VoteId()),
            # load the number of vote options for this question
            option_counts[question_idx.load()].store_into(answers_count := VoteId()),
            pt.Assert(
                answer_id.get() < answers_count.get(),
                comment="Answer ID invalid",
            ),
            # increment the tally: the index into the tally is the cumulative option count
            # from all the questions so far, plus the vote option for this question
            app.state.tally.increment_vote(
                index=cumulative_offset.load() + answer_id.get()
            ),
            # compute offset for start of next question
            cumulative_offset.store(cumulative_offset.load() + answers_count.get()),
        ),
    )
