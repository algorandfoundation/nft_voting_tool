import LaunchIcon from '@mui/icons-material/Launch'
import { Box, Link } from '@mui/material'
import { VotingRoundMetadata } from '@/shared/IPFSGateway'
import { VotingRoundGlobalState } from '@/shared/VotingRoundContract'

export type VoteDetailsProps = {
  loading: boolean
  appId: number
  globalState: VotingRoundGlobalState | undefined
  roundMetadata: VotingRoundMetadata | undefined
}
export const VoteDetails = ({ loading: _loading, appId: voteId, globalState, roundMetadata }: VoteDetailsProps) => {
  return (
    <>
      {globalState && roundMetadata && (
        <div className="flex">
          <Box className="bg-white flex rounded-xl px-4 py-2 mr-4">
            <Link
              className="no-underline hover:underline"
              href={`${import.meta.env.VITE_IPFS_GATEWAY_URL}/${roundMetadata.voteGatingSnapshotCid}`}
              target="_blank"
            >
              Voting Addresses
              <LaunchIcon className="ml-2 text-grey-light align-bottom" />
            </Link>
          </Box>
          <Box className="bg-white flex rounded-xl px-4 py-2 mr-4">
            <Link
              className="no-underline hover:underline"
              href={`${import.meta.env.VITE_ALGO_EXPLORER_URL}/application/${voteId}`}
              target="_blank"
            >
              Smart contract
              <LaunchIcon className="ml-2 text-grey-light align-bottom" />
            </Link>
          </Box>
          <Box className="bg-white flex rounded-xl px-4 py-2 mr-4">
            <Link
              className="no-underline hover:underline"
              href={`${import.meta.env.VITE_IPFS_GATEWAY_URL}/${globalState.metadata_ipfs_cid}`}
              target="_blank"
            >
              Voting session metadata
              <LaunchIcon className="ml-2 text-grey-light align-bottom" />
            </Link>
          </Box>
        </div>
      )}
    </>
  )
}
