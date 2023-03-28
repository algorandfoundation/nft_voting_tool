import { Button, Skeleton, Typography } from '@mui/material'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSetRecoilState } from 'recoil'
import api, { votingRoundsAtom } from '../../shared/api'
import { VotingRound } from '../../shared/types'
import { getWalletLabel } from '../../shared/wallet'
import { useConnectedWallet, useSetShowConnectWalletModal } from '../wallet/state'
import { NoRounds } from './NoRounds'
import { VotingRoundTile } from './VotingRoundTile'

const VotingRoundTileLoading = () => (
  <>
    <Skeleton className="h-32" variant="rectangular" />
    <Skeleton className="h-32" variant="rectangular" />
  </>
)

const VotingRounds = () => {
  const setShowConnectWalletModal = useSetShowConnectWalletModal()
  const myWalletAddress = useConnectedWallet()
  const { data, loading } = api.useVotingRounds(myWalletAddress)
  const setState = useSetRecoilState(votingRoundsAtom)

  useEffect(() => {
    setState(data)
  }, [data])

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

      <Typography className="mb-3" variant="h4">
        Open voting rounds
      </Typography>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-8">
        {loading ? (
          <VotingRoundTileLoading />
        ) : !data?.openRounds.length ? (
          <NoRounds label="open" />
        ) : (
          data?.openRounds.map((round: VotingRound) => <VotingRoundTile key={round.id} round={round} />)
        )}
      </div>
      <Typography className="mt-8 mb-3" variant="h4">
        Closed voting rounds
      </Typography>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-8">
        {loading ? (
          <VotingRoundTileLoading />
        ) : !data?.closedRounds.length ? (
          <NoRounds label="closed" />
        ) : (
          data?.closedRounds.map((round: VotingRound) => <VotingRoundTile key={round.id} round={round} />)
        )}
      </div>
    </div>
  )
}

export default VotingRounds
