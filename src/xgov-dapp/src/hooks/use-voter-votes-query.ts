import { useWallet } from '@txnlab/use-wallet'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { UseXGovQueryOptions } from './index'
import { fetchVoterVotes } from '../../../dapp/src/shared/VotingRoundContract'
import useGlobalStateQuery from './use-global-state-query'
import useMetadataQuery from './use-metadata-query'

export type UseVoterVotesQueryOptions = UseQueryOptions<unknown | null, unknown, unknown | null>
export function useVoterVotesQuery(voteId: string | number | undefined, options?: UseXGovQueryOptions) {
  const { activeAddress } = useWallet()
  const globalState = useGlobalStateQuery(voteId, options)
  const metadata = useMetadataQuery(voteId, options)

  return useQuery<unknown | null>(
    ['voterVotes', voteId, activeAddress],
    () => {
      if (typeof voteId === 'number') {
        return fetchVoterVotes(voteId, activeAddress, metadata.data, globalState.data).then((res) => {
          if (typeof res === 'undefined') return null
          return res
        })
      }

      if (typeof voteId === 'string') {
        return fetchVoterVotes(parseInt(voteId), activeAddress, metadata.data, globalState.data).then((res) => {
          if (typeof res === 'undefined') return null
          return res
        })
      }

      return null
    },
    {
      enabled:
        typeof voteId !== 'undefined' &&
        typeof activeAddress !== 'undefined' &&
        activeAddress !== null &&
        typeof metadata.data !== 'undefined' &&
        typeof globalState.data !== 'undefined',
      ...options?.voterVotes,
    },
  )
}
