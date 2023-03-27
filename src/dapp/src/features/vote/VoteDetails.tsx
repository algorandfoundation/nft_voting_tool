import { Link, Skeleton, Stack, Typography } from '@mui/material'
import { VotingRound } from '../../shared/types'
import { getWalletAddresses } from '../../shared/wallet'

type VoteDetailsProps = {
  loading: boolean
  round: VotingRound | undefined | null
}
export const VoteDetails = ({ loading, round }: VoteDetailsProps) => (
  <Stack spacing={1}>
    <Typography className="mt-5 font-bold sm:font-normal" variant="h5">
      Vote details
    </Typography>
    {loading ? (
      <Skeleton variant="text" />
    ) : (
      <Typography>
        Voting round created by <Link className="font-normal">NF Domain</Link>
      </Typography>
    )}
    {loading ? <Skeleton variant="text" /> : <Link>Smart contract</Link>}
    {loading ? <Skeleton variant="text" /> : <Link>Voting round details in IPFS</Link>}
    {loading ? <Skeleton variant="text" /> : getWalletAddresses(round?.snapshotFile).length ? <Link>Allow list</Link> : null}
  </Stack>
)
