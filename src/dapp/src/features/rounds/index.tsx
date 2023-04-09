import { Button, Skeleton, Typography } from '@mui/material'
import sortBy from 'lodash.sortby'
import { Link } from 'react-router-dom'
import api from '../../shared/api'
import { VotingRoundPopulated } from '../../shared/types'
import { getVoteEnded, getVoteStarted } from '../../shared/vote'
import { getWalletLabel } from '../../shared/wallet'
import { useConnectedWallet, useCreatorAddresses, useSetShowConnectWalletModal } from '../wallet/state'
import { VotingRoundSection } from './VotingRoundSection'

export const VotingRoundTileLoading = () => (
  <>
    <Skeleton className="h-32" variant="rectangular" />
    <Skeleton className="h-32" variant="rectangular" />
  </>
)

const getRounds = (
  rounds: VotingRoundPopulated[],
  filterPredicate: (r: VotingRoundPopulated) => boolean,
  sortPredicate: Parameters<typeof sortBy>[1],
): VotingRoundPopulated[] => {
  const filtered = rounds.filter(filterPredicate)
  const sorted = sortBy(filtered, sortPredicate)
  return sorted
}

const VotingRounds = () => {
  const setShowConnectWalletModal = useSetShowConnectWalletModal()
  const myWalletAddress = useConnectedWallet()
  const creatorAddresses = useCreatorAddresses()
  const showMyRounds = creatorAddresses.length == 0 || creatorAddresses.includes('any')
  const isCreator = myWalletAddress && (creatorAddresses.includes(myWalletAddress) || creatorAddresses.includes('any'))
  const { data, loading } = showMyRounds && myWalletAddress ? api.useVotingRounds(myWalletAddress) : api.useVotingRounds(creatorAddresses)
  const walletLabel = showMyRounds ? getWalletLabel(myWalletAddress) : creatorAddresses.map(getWalletLabel).join(', ')

  const openRounds = data
    ? getRounds(
        data.rounds,
        (r) => getVoteStarted(r) && !getVoteEnded(r),
        (r: VotingRoundPopulated) => r.end,
      )
    : []

  const upcomingRounds = data
    ? getRounds(
        data.rounds,
        (r) => !getVoteStarted(r),
        (r: VotingRoundPopulated) => r.start,
      )
    : []

  const closedRounds = data
    ? getRounds(
        data.rounds,
        (r) => getVoteEnded(r),
        (r: VotingRoundPopulated) => r.end,
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
        <Typography variant="body1">
          Voting rounds created by {/[,]/.test(walletLabel) ? 'wallet' : 'wallets'} {walletLabel}
        </Typography>
      )}

      {isCreator && (
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
