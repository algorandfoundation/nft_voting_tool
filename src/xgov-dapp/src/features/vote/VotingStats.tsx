import { ChartPieIcon } from '@heroicons/react/24/solid'
import { Box, Skeleton, Typography } from '@mui/material'
import React from 'react'
import { VoteGatingSnapshot } from '../../../../dapp/src/shared/IPFSGateway'
import { TallyCounts, VotingRoundGlobalState } from '../../../../dapp/src/shared/VotingRoundContract'

interface VotingStatsComponentProps {
  votingRoundGlobalState: VotingRoundGlobalState
  votingRoundResults: TallyCounts | undefined
  snapshot: VoteGatingSnapshot | undefined
  isLoading: boolean
}

const VotingStats: React.FC<VotingStatsComponentProps> = ({ votingRoundGlobalState, votingRoundResults, snapshot, isLoading }) => {
  const totalVotes = votingRoundResults?.reduce((accumulator, curr) => {
    return accumulator + curr.count
  }, 0)

  const totalVotingPower = snapshot?.snapshot.reduce((accumulator, curr) => {
    return accumulator + (curr.weight || 0)
  }, 0)
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
        {!isLoading && snapshot && votingRoundGlobalState && (
          <Typography className="mt-1">{`${votingRoundGlobalState.voter_count} out of ${snapshot.snapshot.length} wallets voted`}</Typography>
        )}
        {isLoading ? <Skeleton className="h-6 w-full" variant="text" /> : null}
        {!isLoading && totalVotes !== undefined && totalVotingPower !== undefined && totalVotingPower !== 0 && (
          <Typography className="mt-3">
            {`${totalVotes.toLocaleString()} out of ${totalVotingPower.toLocaleString()} total stake voted`}{' '}
            <strong>{` (${((100 * totalVotes) / totalVotingPower).toLocaleString(undefined, { maximumFractionDigits: 2 })}%)`}</strong>
          </Typography>
        )}
      </div>
    </Box>
  )
}

export default VotingStats
