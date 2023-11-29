import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { fetchVotingSnapshot, VoteGatingSnapshot } from '../../../dapp/src/shared/IPFSGateway'
import useMetadataQuery from './use-metadata-query'
import { UseXGovQueryOptions } from './index'

export type UseSnapshotQueryOptions = UseQueryOptions<VoteGatingSnapshot | undefined, unknown, VoteGatingSnapshot | undefined>

export default function useSnapshotQuery(voteId: number | string | undefined, options?: UseXGovQueryOptions) {
  const metadata = useMetadataQuery(voteId, options)
  return useQuery<VoteGatingSnapshot | undefined>(
    ['snapshot', voteId],
    () => {
      if (typeof metadata.data?.voteGatingSnapshotCid !== 'undefined') {
        return fetchVotingSnapshot(metadata.data.voteGatingSnapshotCid)
      } else {
        return undefined
      }
    },
    {
      enabled: typeof metadata.data?.voteGatingSnapshotCid !== 'undefined',
      staleTime: Infinity,
      ...options?.snapshot,
    },
  )
}
