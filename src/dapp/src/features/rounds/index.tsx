import { Button, Skeleton, Typography } from '@mui/material'
import sortBy from 'lodash.sortby'
import { Link } from 'react-router-dom'
import api from '../../shared/api'
import { VotingRound } from '../../shared/types'
import { getVoteEnded, getVoteStarted } from '../../shared/vote'
import { getWalletLabel } from '../../shared/wallet'
import { useConnectedWallet, useSetShowConnectWalletModal } from '../wallet/state'
import { VotingRoundSection } from './VotingRoundSection'

export const VotingRoundTileLoading = () => (
  <>
    <Skeleton className="h-32" variant="rectangular" />
    <Skeleton className="h-32" variant="rectangular" />
  </>
)

const getRounds = (
  rounds: VotingRound[],
  filterPredicate: (r: VotingRound) => boolean,
  sortPredicate: Parameters<typeof sortBy>[1],
): VotingRound[] => {
  const filtered = rounds.filter(filterPredicate)
  const sorted = sortBy(filtered, sortPredicate)
  return sorted
}

const VotingRounds = () => {
  const { data, loading } = api.useVotingRounds()
  const setShowConnectWalletModal = useSetShowConnectWalletModal()
  const myWalletAddress = useConnectedWallet()

  const openRounds = data
    ? getRounds(
        data.rounds,
        (r) => getVoteStarted(r) && !getVoteEnded(r),
        (r: VotingRound) => r.end,
      )
    : []

  const upcomingRounds = data
    ? getRounds(
        data.rounds,
        (r) => !getVoteStarted(r),
        (r: VotingRound) => r.start,
      )
    : []

  const closedRounds = data
    ? getRounds(
        data.rounds,
        (r) => getVoteEnded(r),
        (r: VotingRound) => r.end,
      )
    : []

  return (
    <div className="container">
      <Typography variant="h3">My voting rounds</Typography>
      {loading ? (
        <Skeleton variant="text" />
      ) : !myWalletAddress ? (
        <div className="my-8">
          <Button variant="contained" onClick={() => setShowConnectWalletModal(true)}>
            Connect wallet
          </Button>
        </div>
      ) : (
        <Typography variant="body1">Voting rounds created by wallet {getWalletLabel(myWalletAddress)}</Typography>
      )}

      {myWalletAddress && (
        <Button component={Link} to="/create" className="my-8" variant="contained">
          Create new voting round
        </Button>
      )}

      <VotingRoundSection label="Open" rounds={openRounds} loading={loading} />
      <VotingRoundSection label="Opening soon" rounds={upcomingRounds} loading={loading} />
      <VotingRoundSection label="Closed" rounds={closedRounds} loading={loading} />
    </div>
  )
}

export default VotingRounds
