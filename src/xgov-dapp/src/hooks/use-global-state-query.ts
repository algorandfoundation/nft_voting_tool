import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { fetchVotingRoundGlobalState, VotingRoundGlobalState } from '../../../dapp/src/shared/VotingRoundContract'
import { UseXGovQueryOptions } from './index'

export type UseGlobalStateQueryOptions = UseQueryOptions<VotingRoundGlobalState | undefined, unknown, VotingRoundGlobalState | undefined>

export default function useGlobalStateQuery(voteId: string | number | undefined, options?: UseXGovQueryOptions) {
  return useQuery<VotingRoundGlobalState | undefined>(
    ['globalState', voteId],
    () => {
      if (typeof voteId === 'number') {
        return fetchVotingRoundGlobalState(voteId)
      }
      if (typeof voteId === 'string') {
        return fetchVotingRoundGlobalState(parseInt(voteId))
      }
      return undefined
    },
    {
      enabled: typeof voteId !== 'undefined',
      ...options?.globalState,
    },
  )
}
