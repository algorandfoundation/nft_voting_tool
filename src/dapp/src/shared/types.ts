import { CreatedMetadata, Question, VoteGatingSnapshot } from './IPFSGateway'

export type VoteId = {
  id: number
}

export type RoundInfo = {
  voteTitle: string
  voteDescription: string
  start: string
  end: string
  snapshotFile?: string | undefined
  minimumVotes?: number | undefined
  voteInformationUrl?: string
}

export type VotingRoundPopulated = {
  id: number
  cid: string
  title: string
  description: string
  start: string
  end: string
  quorum?: number
  snapshot?: VoteGatingSnapshot
  voteGatingSnapshotCid?: string
  informationUrl?: string
  questions: Question[]
  created: CreatedMetadata
  votes?: Vote[]
}

export type Vote = {
  walletAddress: string
  selectedOption: string
}

export type VotingRoundResult = {
  questionId: string
  optionId: string
  count: number
}

export type QuestionModel = {
  questionTitle: string
  questionDescription?: string
  answers: string[]
}

export type VotingRoundModel = RoundInfo & QuestionModel & VoteId & { snapshot?: VoteGatingSnapshot }
