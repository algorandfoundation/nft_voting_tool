import dayjs from 'dayjs'
import { VotingRoundGlobalState } from './../../../dapp/src/shared/VotingRoundContract'

export const getHasVoteStarted = (round: VotingRoundGlobalState) => dayjs(round.start_time) <= dayjs()

export const getHasVoteEnded = (round: VotingRoundGlobalState) => dayjs(round.end_time) <= dayjs() || !!round.close_time
