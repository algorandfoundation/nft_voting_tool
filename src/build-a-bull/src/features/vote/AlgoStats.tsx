import { CircleStackIcon } from '@heroicons/react/24/solid'
import { Box, Skeleton, Typography } from '@mui/material'
import React from 'react'
import { VotingRoundMetadata } from '../../../../dapp/src/shared/IPFSGateway'
import { TallyCounts } from '../../../../dapp/src/shared/VotingRoundContract'
import { calculateTotalAskedAndAwarded } from '../../shared/stats'

interface AlgoStatsProps {
  votingRoundResults: TallyCounts | undefined
  votingRoundMetadata: VotingRoundMetadata | undefined
  hasVoteClosed: boolean
  isLoading: boolean
  passedReserveList?: Set<string>
}

const AlgoStats: React.FC<AlgoStatsProps> = ({ votingRoundResults, votingRoundMetadata, hasVoteClosed, isLoading, passedReserveList }) => {
  const { totalAsked, totalAwarded } = calculateTotalAskedAndAwarded(votingRoundResults, votingRoundMetadata, passedReserveList)

  return (
    <div>
      <Box className="bg-yellow-light flex rounded-xl px-4 py-6">
        <div>
          <CircleStackIcon className="h-7 w-7 mr-3 -mt-1 text-yellow" />
        </div>
        <div className="w-full">
          <Typography className="mb-3">Stats</Typography>
          {isLoading ? (
            <>
              <Skeleton className="h-7 w-full mb-1" variant="text" />
              <Skeleton className="h-7 w-full" variant="text" />
            </>
          ) : null}
          {!isLoading && votingRoundMetadata && votingRoundResults ? (
            <>
              <Typography className="mb-3">
                {hasVoteClosed
                  ? `${totalAwarded.toLocaleString()} out of ${totalAsked.toLocaleString()} ALGO awarded`
                  : `${totalAsked.toLocaleString()} total ALGO asked`}
              </Typography>
              <Typography>{!hasVoteClosed ? `${totalAwarded.toLocaleString()} ALGO approved` : ''}&nbsp;</Typography>
            </>
          ) : null}
        </div>
      </Box>
    </div>
  )
}

export default AlgoStats
