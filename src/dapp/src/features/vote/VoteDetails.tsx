import { Link, Skeleton, Stack, Typography } from '@mui/material'
import { VotingRoundPopulated } from '../../shared/types'
import { getWalletLabel } from '../../shared/wallet'

type VoteDetailsProps = {
  loading: boolean
  round: VotingRoundPopulated | undefined | null
}
export const VoteDetails = ({ loading, round }: VoteDetailsProps) => (
  <>
    {round && (
      <Stack spacing={1}>
        <Typography className="mt-5 font-bold sm:font-normal" variant="h5">
          Vote details
        </Typography>
        {loading ? (
          <Skeleton variant="text" />
        ) : (
          <Typography>
            Voting round created by{' '}
            <Link href={`https://testnet.algoexplorer.io/address/${round.created.by}`} target="_blank" className="font-normal">
              {getWalletLabel(round.created.by)}
            </Link>
          </Typography>
        )}
        {loading ? (
          <Skeleton variant="text" />
        ) : (
          <Link href={`https://testnet.algoexplorer.io/application/${round.id}`} target="_blank">
            Smart contract
          </Link>
        )}
        {loading ? (
          <Skeleton variant="text" />
        ) : (
          <Link href={`${import.meta.env.VITE_IPFS_GATEWAY_URL}/${round.cid}`} target="_blank">
            Voting round details in IPFS
          </Link>
        )}
        {loading ? (
          <Skeleton variant="text" />
        ) : round.snapshot?.snapshot.length ? (
          <Link href={`${import.meta.env.VITE_IPFS_GATEWAY_URL}/${round.voteGatingSnapshotCid}`} target="_blank">
            Allow list
          </Link>
        ) : null}
      </Stack>
    )}
  </>
)
