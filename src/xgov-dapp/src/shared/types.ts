import { VoteGatingSnapshot } from '@/shared/IPFSGateway'


export type QuestionModel = {
  questionTitle: string
  questionDescription?: string
  answers: string[]
  metadata?: Record<string, unknown>
}

export type VoteId = {
  id: number
}

export enum VoteType {
  NO_SNAPSHOT = 0,
  NO_WEIGHTING = 1,
  WEIGHTING = 2,
  PARTITIONED_WEIGHTING = 3,
}

export type RoundInfo = {
  voteType?: VoteType
  voteTitle: string
  voteDescription?: string | undefined
  start: string
  end: string
  proposalFile: string
  snapshotFile?: string | undefined
  minimumVotes?: number | undefined
  voteInformationUrl?: string
}
// export type RoundInfo = {
//   voteTitle: string
//   voteDescription?: string
//   voteInformationUrl?: string
//   start: string
//   end: string
//   proposalFile: string
//   snapshotFile?: string | undefined
// }

export type Vote = {
  walletAddress: string
  selectedOption: string
}

export type VotingRoundResult = {
  optionId: string
  count: number
}

export type VotingRoundModel = RoundInfo & { questions: QuestionModel[] } & VoteId & { snapshot?: VoteGatingSnapshot }
// export type VotingRoundModel = RoundInfo & VoteId & { snapshot?: VoteGatingSnapshot }
