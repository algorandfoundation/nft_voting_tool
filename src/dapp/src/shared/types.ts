import { VoteGatingSnapshot } from './IPFSGateway'

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
