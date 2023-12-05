import { UseGlobalStateQueryOptions } from './use-global-state-query'
import { UseMetadataQueryOptions } from './use-metadata-query'
import { UseSnapshotQueryOptions } from './use-snapshot-query'
import { UseTallyCountsQueryOptions } from './use-tally-counts-query'
import { UseVoterVotesQueryOptions } from './use-voter-votes-query'

export type UseXGovQueryOptions = {
  globalState?: UseGlobalStateQueryOptions
  metadata?: UseMetadataQueryOptions
  snapshot?: UseSnapshotQueryOptions
  tallyCounts?: UseTallyCountsQueryOptions
  voterVotes?: UseVoterVotesQueryOptions
}
