import { Box, Button, Link, Typography } from '@mui/material'
import { VotingRoundPopulated } from '../../shared/types'
import { getVoteEnded, getVoteStarted } from '../../shared/vote'
import { getWalletLabel } from '../../shared/wallet'
import { useConnectedWallet, useSetShowConnectWalletModal } from '../wallet/state'

type WalletVoteStatusProps = {
  round: VotingRoundPopulated
  allowedToVote: boolean
  myVotes?: string[]
}

export const WalletVoteStatus = ({ round, allowedToVote, myVotes }: WalletVoteStatusProps) => {
  const walletAddress = useConnectedWallet()
  const voteStarted = getVoteStarted(round)
  const voteEnded = getVoteEnded(round)
  const setShowConnectedWalletModal = useSetShowConnectWalletModal()
  const showConnectWalletModal = () => setShowConnectedWalletModal(true)
  return (
    <>
      {round.snapshot?.snapshot.length ? (
        <div className="mb-4">
          <Typography>
            This voting round is restricted to wallets on the{' '}
            <Link className="font-normal" target="_blank" href={`${import.meta.env.VITE_IPFS_GATEWAY_URL}/${round.voteGatingSnapshotCid}`}>
              allowlist
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
          <Typography className="font-semibold text-grey-dark">Your wallet is not on the allowlist for this voting round</Typography>
        </Box>
      )}
      {walletAddress && allowedToVote && !myVotes && (
        <Box className="bg-algorand-green text-center p-3 rounded-xl">
          <Typography className="font-semibold text-grey-dark">Wallet connected: {getWalletLabel(walletAddress)}</Typography>
        </Box>
      )}
      {myVotes && (
        <Box className="bg-algorand-green text-center p-3 rounded-xl">
          <Typography className="font-semibold text-grey-dark">
            You voted, and chose {myVotes?.map((v) => round.questions[0].options.find((o) => o.id === v)?.label).join(', ')}
          </Typography>
        </Box>
      )}
    </>
  )
}
