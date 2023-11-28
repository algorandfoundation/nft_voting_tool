import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { fetchTallyCounts, TallyCounts } from '../../../dapp/src/shared/VotingRoundContract'
import useMetadataQuery from './use-metadata-query'
import { UseXGovQueryOptions } from './index'

export type UseTallyCountsQueryOptions = UseQueryOptions<TallyCounts | undefined, unknown, TallyCounts | undefined>
export default function useTallyCountsQuery(voteId: string | number | undefined, options?: UseXGovQueryOptions) {
  const metadata = useMetadataQuery(voteId, options)

  return useQuery<TallyCounts | undefined>(
    ['tallyCount', voteId],
    () => {
      if (typeof metadata.data === 'undefined') return undefined
      if (typeof voteId === 'number') {
        return fetchTallyCounts(voteId, metadata.data)
      }
      if (typeof voteId === 'string') {
        return fetchTallyCounts(parseInt(voteId), metadata.data)
      }

      return undefined
    },
    {
      enabled: typeof voteId !== 'undefined' && typeof metadata.data !== 'undefined',
      ...options?.tallyCounts,
    },
  )
}
