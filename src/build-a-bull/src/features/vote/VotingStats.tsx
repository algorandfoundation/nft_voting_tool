import { ChartPieIcon } from '@heroicons/react/24/solid'
import { Box, Skeleton, Typography } from '@mui/material'
import React from 'react'
import { VotingRoundGlobalState } from '@/shared/VotingRoundContract'

interface VotingStatsComponentProps {
  votingRoundGlobalState: VotingRoundGlobalState
  isLoading: boolean
}

const VotingStats: React.FC<VotingStatsComponentProps> = ({ votingRoundGlobalState, isLoading }) => {
  return (
    <Box className="bg-blue-light flex rounded-xl px-4 py-6">
      <div>
        <ChartPieIcon className="h-7 w-7 mr-3 -mt-1 text-blue" />
      </div>
      <div className="w-full">
        <Typography className="mb-3">
          <strong>Voting stats</strong>
        </Typography>
        {isLoading ? <Skeleton className="h-6 w-full" variant="text" /> : null}
        {!isLoading && votingRoundGlobalState && <Typography>{`${votingRoundGlobalState.voter_count} wallets voted`}</Typography>}
        <Typography className="mb-3">&nbsp;</Typography>
      </div>
    </Box>
  )
}

export default VotingStats
