import { VoteGatingSnapshot } from './IPFSGateway'

export type VoteId = {
  id: number
}

export type RoundInfo = {
  voteTitle: string
  voteDescription: string
  voteInformationUrl?: string
  start: string
  end: string
  proposalFile: string
  snapshotFile?: string | undefined
}

export type Vote = {
  walletAddress: string
  selectedOption: string
}

export type VotingRoundResult = {
  optionId: string
  count: number
}

export type Proposal = {
  title: string
  description: string
  link: string
  threshold: number
  category: string
}

export type VotingRoundModel = RoundInfo & { proposals: Proposal[] } & VoteId & { snapshot?: VoteGatingSnapshot }
