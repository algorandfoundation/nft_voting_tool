import PieChartIcon from '@mui/icons-material/PieChart'
import { Box, Typography } from '@mui/material'
import React from 'react'
import { VoteGatingSnapshot } from '../../../../dapp/src/shared/IPFSGateway'
import { VotingRoundGlobalState } from '../../../../dapp/src/shared/VotingRoundContract'

interface VotingStatsComponentProps {
  votingRoundGlobalState: VotingRoundGlobalState
  snapshot: VoteGatingSnapshot | undefined
}

const VotingStats: React.FC<VotingStatsComponentProps> = ({ votingRoundGlobalState, snapshot }) => {
  return (
    <div>
      {votingRoundGlobalState && snapshot && (
        <Box className="bg-blue-light flex rounded-xl px-4 py-6">
          <div>
            <PieChartIcon className="align-bottom mr-4 text-blue" />
          </div>
          <div>
            <Typography className="mb-3">Voting stats</Typography>
            {snapshot && (
              <Typography>{`${votingRoundGlobalState.voter_count} out of ${snapshot.snapshot.length} wallets voted`}</Typography>
            )}
            <Typography className="mb-3">&nbsp;</Typography>
          </div>
        </Box>
      )}
    </div>
  )
}

export default VotingStats
