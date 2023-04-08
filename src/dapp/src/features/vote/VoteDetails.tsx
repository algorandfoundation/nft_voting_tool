import { Link, Skeleton, Stack, Typography } from '@mui/material'
import { DisplayAddress } from '../../shared/DisplayAddress'
import { VotingRoundPopulated } from '../../shared/types'
import { VotingTime } from './VotingTime'

type VoteDetailsProps = {
  loading: boolean
  round: VotingRoundPopulated | undefined | null
}
export const VoteDetails = ({ loading, round }: VoteDetailsProps) => {
  return (
    <>
      {round && (
        <Stack spacing={1}>
          <Typography className="mt-5 font-bold sm:font-normal" variant="h5">
            Vote details
          </Typography>
          <VotingTime className="hidden sm:block mt-4" loading={loading} round={round} />
          {loading ? (
            <Skeleton variant="text" />
          ) : (
            <Typography>
              Voting round created by <DisplayAddress address={round.created.by} />
            </Typography>
          )}
          {loading ? (
            <Skeleton variant="text" />
          ) : (
            <Link href={`${import.meta.env.VITE_ALGO_EXPLORER_URL}/application/${round.id}`} target="_blank">
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
}
