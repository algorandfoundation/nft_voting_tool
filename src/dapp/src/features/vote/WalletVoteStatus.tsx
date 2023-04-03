import { Box, Button, Link, Typography } from '@mui/material'
import { VotingRoundPopulated } from '../../shared/types'
import { getMyVote, getVoteEnded, getVoteStarted } from '../../shared/vote'
import { getWalletLabel } from '../../shared/wallet'
import { useConnectedWallet, useSetShowConnectWalletModal } from '../wallet/state'

type WalletVoteStatusProps = {
  round: VotingRoundPopulated
  allowedToVote: boolean
}

export const WalletVoteStatus = ({ round, allowedToVote }: WalletVoteStatusProps) => {
  const walletAddress = useConnectedWallet()
  const voteStarted = getVoteStarted(round)
  const voteEnded = getVoteEnded(round)
  const myVote = getMyVote(round, walletAddress)
  const setShowConnectedWalletModal = useSetShowConnectWalletModal()
  const showConnectWalletModal = () => setShowConnectedWalletModal(true)
  return (
    <>
      {round.snapshot?.snapshot.length ? (
        <div className="mb-4">
          <Typography>
            This voting round is restricted to wallets on the{' '}
            <Link className="font-normal" href="/">
              allow list
            </Link>
            .
          </Typography>
        </div>
      ) : null}
      {!walletAddress && !voteEnded && (
        <Button onClick={showConnectWalletModal} variant="contained" disabled={!voteStarted}>
          Connect wallet to vote
        </Button>
      )}
      {walletAddress && !allowedToVote && (
        <Box className="bg-algorand-warning text-center p-3 rounded-xl">
          <Typography className="font-semibold text-grey-dark">Your wallet is not on the allow list for this voting round</Typography>
        </Box>
      )}
      {walletAddress && allowedToVote && !myVote && (
        <Box className="bg-algorand-green text-center p-3 rounded-xl">
          <Typography className="font-semibold text-grey-dark">Wallet connected: {getWalletLabel(walletAddress)}</Typography>
        </Box>
      )}
      {myVote && (
        <Box className="bg-algorand-green text-center p-3 rounded-xl">
          <Typography className="font-semibold text-grey-dark">You voted, and chose [{myVote}]</Typography>
        </Box>
      )}
    </>
  )
}
