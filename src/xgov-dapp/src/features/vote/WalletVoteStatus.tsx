import { Box, Button, Link, Typography } from '@mui/material'
import { VotingRoundMetadata } from '../../shared/IPFSGateway'
import { getWalletLabel } from '../../shared/wallet'
import { useSetShowConnectWalletModal } from '../wallet/state'

type WalletVoteStatusProps = {
  roundMetadata: VotingRoundMetadata | undefined
  activeAddress: string | undefined
  allowedToVote: boolean
  hasVoteStarted: boolean
  hasVoteEnded: boolean
  myVotes?: string[]
}

export const WalletVoteStatus = ({
  roundMetadata,
  activeAddress,
  allowedToVote,
  hasVoteStarted,
  hasVoteEnded,
  myVotes,
}: WalletVoteStatusProps) => {
  const setShowConnectedWalletModal = useSetShowConnectWalletModal()
  const showConnectWalletModal = () => setShowConnectedWalletModal(true)
  return (
    <>
      {roundMetadata && roundMetadata.voteGatingSnapshotCid ? (
        <div className="mb-4">
          <Typography>
            This voting round is restricted to wallets on the{' '}
            <Link
              className="font-normal"
              target="_blank"
              href={`${import.meta.env.VITE_IPFS_GATEWAY_URL}/${roundMetadata.voteGatingSnapshotCid}`}
            >
              allowlist
            </Link>
            .
          </Typography>
        </div>
      ) : null}
      {!activeAddress && !hasVoteEnded && (
        <Button onClick={showConnectWalletModal} variant="contained" disabled={!hasVoteStarted}>
          Connect wallet to vote
        </Button>
      )}
      {activeAddress && !allowedToVote && (
        <Box className="bg-algorand-warning text-center p-3 rounded-xl">
          <Typography className="font-semibold text-grey-dark">Your wallet is not on the allowlist for this voting round</Typography>
        </Box>
      )}
      {activeAddress && allowedToVote && !myVotes && (
        <Box className="bg-algorand-green text-center p-3 rounded-xl">
          <Typography className="font-semibold text-grey-dark">Wallet connected: {getWalletLabel(activeAddress)}</Typography>
        </Box>
      )}
      {roundMetadata && myVotes && (
        <Box className="bg-algorand-green text-center p-3 rounded-xl">
          <Typography className="font-semibold text-grey-dark">
            You voted, and chose: {myVotes?.map((v, i) => roundMetadata.questions[i].options.find((o) => o.id === v)?.label).join(', ')}
          </Typography>
        </Box>
      )}
    </>
  )
}
