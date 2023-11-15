import { VoteGatingSnapshot } from '../../../dapp/src/shared/IPFSGateway'

export type VoteId = {
  id: number
}

export type RoundInfo = {
  voteTitle: string
  voteDescription?: string
  voteInformationUrl?: string
  start: string
  end: string
  proposalFile: string
  snapshotFile?: string | undefined
  communityGrantAllocation?: number | undefined
}

export type Vote = {
  walletAddress: string
  selectedOption: string
}

export type VotingRoundResult = {
  optionId: string
  count: number
}

export enum VoteType {
  NO_SNAPSHOT = 0,
  NO_WEIGHTING = 1,
  WEIGHTING = 2,
  PARTITIONED_WEIGHTING = 3,
}

export type VotingRoundModel = RoundInfo & VoteId & { snapshot?: VoteGatingSnapshot }
