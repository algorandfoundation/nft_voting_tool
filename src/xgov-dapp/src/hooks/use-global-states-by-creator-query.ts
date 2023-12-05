import { useQuery } from '@tanstack/react-query'
import type { VotingRoundGlobalState } from '../../../dapp/src/shared/VotingRoundContract'
import { fetchVotingRoundGlobalStatesByCreators } from '../../../dapp/src/shared/VotingRoundContract'

export default function useGlobalStatesByCreatorQuery(addresses: string[]) {
  return useQuery<VotingRoundGlobalState[]>(['globalStatesByCreator', addresses], () => {
    return fetchVotingRoundGlobalStatesByCreators(addresses)
  })
}
