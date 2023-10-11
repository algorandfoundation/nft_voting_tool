import { UseQueryResult } from '@tanstack/react-query'

import type { TallyCounts, VotingRoundGlobalState } from '../../../dapp/src/shared/VotingRoundContract'
import type { VoteGatingSnapshot, VotingRoundMetadata } from '../../../dapp/src/shared/IPFSGateway'
import api from '../shared/api'
import { useWallet } from '@makerx/use-wallet'
import { getHasVoteEnded, getHasVoteStarted } from '../shared/vote'
import useGlobalStateQuery from './use-global-state-query'
import useMetadataQuery from './use-metadata-query'
import useSnapshotQuery from './use-snapshot-query'
import useTallyCountsQuery from './use-tally-counts-query'
import { useVoterVotesQuery } from './use-voter-votes-query'
import { UseXGovQueryOptions } from './index'

type UseVotingRoundQueryResponse = {
  errors: Error[]
  data: {
    hasVoteStarted: boolean
    hasVoteEnded: boolean
    hasClosed: boolean
    submit: any
    close: any
    globalState: VotingRoundGlobalState | undefined
    snapshot: VoteGatingSnapshot | undefined
    metadata: VotingRoundMetadata | undefined
    tallyCounts: TallyCounts | undefined
  }
  refetch: any
  isLoading: boolean
  isError: boolean
}

function getLoading(...queries: UseQueryResult[]) {
  return queries.some((query) => query.isLoading)
}

function getError(...queries: UseQueryResult[]) {
  return queries.some((query) => query.isError)
}

function getErrors(...queries: UseQueryResult[]): Error[] {
  return queries.filter((query) => query.isError).map((query) => query.error as Error)
}

/**
 * Fetches all the data for a voting round
 *
 * @param {number | string | undefined} voteId
 * @param {UseXGovQueryOptions} [options]
 */
export function useVotingRound(voteId: number | string | undefined, options?: UseXGovQueryOptions): UseVotingRoundQueryResponse {
  voteId = typeof voteId === 'string' ? parseInt(voteId) : voteId
  // Effects
  const globalState = useGlobalStateQuery(voteId, options)
  const metadata = useMetadataQuery(voteId, options)
  const snapshot = useSnapshotQuery(voteId, options)
  const tallyCounts = useTallyCountsQuery(voteId, options)

  // API Actions
  const submit = api.useSubmitVote()
  const close = api.useCloseVotingRound()

  // Combined State
  const isLoading = getLoading(globalState, metadata, snapshot, tallyCounts)
  const isError = getError(globalState, metadata, snapshot, tallyCounts)
  const errors = getErrors(globalState, metadata, snapshot, tallyCounts)

  // Derived State
  const hasVoteStarted = !globalState.data ? false : getHasVoteStarted(globalState.data)
  const hasVoteEnded = !globalState.data ? false : getHasVoteEnded(globalState.data)
  const hasClosed = globalState.data !== undefined && globalState.data.close_time !== undefined

  // Effects return
  return {
    errors,
    data: {
      globalState: globalState.data,
      snapshot: snapshot.data,
      metadata: metadata.data,
      tallyCounts: tallyCounts.data,
      hasVoteStarted,
      hasVoteEnded,
      hasClosed,
      submit,
      close,
    },
    refetch: tallyCounts.refetch,
    isLoading,
    isError,
  }
}

export function useVoter(voteId: string | number | undefined, options?: UseXGovQueryOptions) {
  voteId = typeof voteId === 'string' ? parseInt(voteId) : voteId

  // Effects
  const { activeAddress } = useWallet()
  const metadata = useMetadataQuery(voteId, options)
  const snapshot = useSnapshotQuery(voteId, options)
  const voterVotes = useVoterVotesQuery(voteId, options)

  // Combined State
  const isLoading = getLoading(metadata, snapshot, voterVotes)
  const isError = getError(metadata, snapshot, voterVotes)
  const errors = getErrors(metadata, snapshot, voterVotes)

  // Derived State
  const addressSnapshot = snapshot.data?.snapshot.find((addressSnapshot) => {
    return addressSnapshot.address === activeAddress && typeof activeAddress !== 'undefined'
  })
  const voteWeight = addressSnapshot?.weight && isFinite(addressSnapshot.weight) ? addressSnapshot.weight : !addressSnapshot?.weight ? 0 : 1

  const allowedToVote = typeof addressSnapshot !== 'undefined'
  const allowlistSignature = addressSnapshot?.signature
  const isVoteCreator = metadata.data?.created.by === activeAddress && typeof activeAddress !== 'undefined'
  const hasVoted = voterVotes.data !== undefined && voterVotes.data !== null

  // Effects return
  return {
    isLoading,
    isError,
    errors,
    allowedToVote,
    refetch: voterVotes.refetch,
    allowlistSignature,
    voteWeight,
    isVoteCreator,
    voterVotes: voterVotes.data,
    hasVoted,
  }
}
