import { Link, Skeleton, Stack, Typography } from '@mui/material'
import { DisplayAddress } from '../../shared/DisplayAddress'
import { VotingRoundMetadata } from '../../shared/IPFSGateway'
import { VotingRoundGlobalState } from '../../shared/votingRoundContract'
import { VotingTime } from './VotingTime'

type VoteDetailsProps = {
  loading: boolean
  appId: number
  globalState: VotingRoundGlobalState | undefined
  roundMetadata: VotingRoundMetadata | undefined
}
export const VoteDetails = ({ loading, appId: voteId, globalState, roundMetadata }: VoteDetailsProps) => {
  return (
    <>
      {globalState && roundMetadata && (
        <Stack spacing={1}>
          <Typography className="mt-5 font-bold sm:font-normal" variant="h5">
            Vote details
          </Typography>
          <VotingTime className="hidden sm:block mt-4" loading={loading} globalState={globalState} />
          {loading ? (
            <Skeleton variant="text" />
          ) : (
            <Typography>
              Voting round created by <DisplayAddress address={roundMetadata.created.by} />
            </Typography>
          )}
          {loading ? (
            <Skeleton variant="text" />
          ) : (
            <Link href={`${import.meta.env.VITE_ALGO_EXPLORER_URL}/application/${voteId}`} target="_blank">
              Smart contract
            </Link>
          )}
          {loading ? (
            <Skeleton variant="text" />
          ) : (
            <Link href={`${import.meta.env.VITE_IPFS_GATEWAY_URL}/${globalState.metadata_ipfs_cid}`} target="_blank">
              Voting round details in IPFS
            </Link>
          )}
          {loading ? (
            <Skeleton variant="text" />
          ) : roundMetadata.voteGatingSnapshotCid ? (
            <Link href={`${import.meta.env.VITE_IPFS_GATEWAY_URL}/${roundMetadata.voteGatingSnapshotCid}`} target="_blank">
              Allowlist
            </Link>
          ) : null}
        </Stack>
      )}
    </>
  )
}
