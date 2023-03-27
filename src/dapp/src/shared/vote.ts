import dayjs from 'dayjs'
import { VotingRound } from './types'

export const getVoteStarted = (round: VotingRound) => dayjs(round.start) <= dayjs()

export const getMyVote = (round: VotingRound, address: string) => {
  const vote = round.votes.find((v) => v.walletAddress === address)
  return vote?.selectedOption
}

export const getVoteEnded = (round: VotingRound) => dayjs(round.end) <= dayjs()
