import dayjs from 'dayjs'
import { VotingRoundPopulated } from './types'

export const getVoteStarted = (round: VotingRoundPopulated) => dayjs(round.start) <= dayjs()

export const getMyVote = (round: VotingRoundPopulated, address: string) => {
  const vote = round.votes?.find((v) => v.walletAddress === address)
  return vote?.selectedOption
}

export const getVoteEnded = (round: VotingRoundPopulated) => dayjs(round.end) <= dayjs()
