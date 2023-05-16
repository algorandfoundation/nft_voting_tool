import { VoteGatingSnapshot } from './IPFSGateway'

export type VoteId = {
  id: number
}

// Keep in sync between voting.py, IPFSGateway.ts and VotingRoundContract.ts
export enum VoteType {
  NO_SNAPSHOT = 0,
  NO_WEIGHTING = 1,
  WEIGHTING = 2,
  PARTITIONED_WEIGHTING = 3,
}

export type RoundInfo = {
  voteType: VoteType
  voteTitle: string
  voteDescription: string
  start: string
  end: string
  snapshotFile?: string | undefined
  minimumVotes?: number | undefined
  voteInformationUrl?: string
}

export type Vote = {
  walletAddress: string
  selectedOption: string
}

export type VotingRoundResult = {
  optionId: string
  count: number
}

export type QuestionModel = {
  questionTitle: string
  questionDescription?: string
  answers: string[]
}

export type VotingRoundModel = RoundInfo & { questions: QuestionModel[] } & VoteId & { snapshot?: VoteGatingSnapshot }
