import dayjs from 'dayjs'
import { VotingRoundPopulated } from './types'

export const getVoteStarted = (round: VotingRoundPopulated) => dayjs(round.start) <= dayjs()

export const getVoteEnded = (round: VotingRoundPopulated) => dayjs(round.end) <= dayjs() || !!round.closedTime
