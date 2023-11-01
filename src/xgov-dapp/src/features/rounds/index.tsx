import { useWallet } from '@makerx/use-wallet'
import sortBy from 'lodash.sortby'
import { VotingRoundGlobalState } from '../../../../dapp/src/shared/VotingRoundContract'
import { VoteType } from '../../shared/types'
import { getHasVoteEnded, getHasVoteStarted } from '../../shared/vote'
import { useCreatorAddresses } from '../wallet/state'
import useGlobalStatesByCreatorQuery from '../../hooks/use-global-states-by-creator-query'
import { VotingRounds } from './VotingRounds'

const getRounds = (
  rounds: VotingRoundGlobalState[],
  filterPredicate: (r: VotingRoundGlobalState) => boolean,
  sortPredicate: Parameters<typeof sortBy>[1],
): VotingRoundGlobalState[] => {
  const filtered = rounds.filter(filterPredicate)
  return sortBy(filtered, sortPredicate)
}

/**
 * Voting Rounds Feature
 *
 * Compose the VotingRounds Component with side effects
 *
 * @constructor
 * @todo: Migrate to HoC (ie withVotingRounds)
 */
export default function VotingRoundsPage() {
  const { activeAddress } = useWallet()
  const creatorAddresses = useCreatorAddresses()
  const showMyRounds = creatorAddresses.length == 0 || creatorAddresses.includes('any')

  let addressesToFetch = [] as string[]
  if (showMyRounds && activeAddress) {
    addressesToFetch = [activeAddress]
  } else if (!showMyRounds) {
    addressesToFetch = creatorAddresses
  }

  const { data: globalStates, isLoading, isError, error } = useGlobalStatesByCreatorQuery(addressesToFetch)

  const open = globalStates
    ? getRounds(
        globalStates,
        (r) => getHasVoteStarted(r) && !getHasVoteEnded(r) && r.vote_type == VoteType.PARTITIONED_WEIGHTING,
        (r: VotingRoundGlobalState) => r.end_time,
      )
    : []

  const upcoming = globalStates
    ? getRounds(
        globalStates,
        (r) => !getHasVoteStarted(r) && !getHasVoteEnded(r) && r.vote_type == VoteType.PARTITIONED_WEIGHTING,
        (r: VotingRoundGlobalState) => r.start_time,
      )
    : []

  const closed = globalStates
    ? getRounds(
        globalStates,
        (r) => getHasVoteEnded(r) && r.vote_type == VoteType.PARTITIONED_WEIGHTING,
        (r: VotingRoundGlobalState) => r.end_time,
      )
    : []
  return (
    <VotingRounds
      rounds={{
        open,
        upcoming,
        closed,
      }}
      creators={creatorAddresses}
      activeAddress={activeAddress}
      isLoading={isLoading}
      isError={isError}
      error={error}
    />
  )
}
