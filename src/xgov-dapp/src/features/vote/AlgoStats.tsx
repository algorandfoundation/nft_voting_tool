import TollIcon from '@mui/icons-material/Toll'
import { Box, Typography } from '@mui/material'
import React from 'react'
import { VotingRoundMetadata } from '../../../../dapp/src/shared/IPFSGateway'
import { TallyCounts } from '../../../../dapp/src/shared/VotingRoundContract'

interface AlgoStatsProps {
  votingRoundResults: TallyCounts | undefined
  votingRoundMetadata: VotingRoundMetadata | undefined
}

const AlgoStats: React.FC<AlgoStatsProps> = ({ votingRoundResults, votingRoundMetadata }) => {
  const optionIdsToCounts = {} as {
    [optionId: string]: number
  }
  votingRoundResults?.forEach((result) => {
    optionIdsToCounts[result.optionId] = result.count
  })

  let totalAwarded = 0
  let totalAsked = 0
  votingRoundMetadata?.questions.forEach((question) => {
    totalAsked += question.metadata?.ask || 0
    question.options.forEach((option) => {
      if (question.metadata && question.metadata.threshold && optionIdsToCounts[option.id] > question.metadata.threshold) {
        totalAwarded += question.metadata?.ask || 0
      }
    })
  })

  if (votingRoundMetadata && votingRoundResults) {
    return (
      <div>
        {votingRoundResults && votingRoundMetadata && (
          <Box className="bg-yellow-light flex rounded-xl px-4 py-6">
            <div>
              <TollIcon className="align-bottom mr-4 text-yellow" />
            </div>
            <div>
              <Typography className="mb-3">ALGO stats</Typography>
              <Typography>{`${totalAwarded.toLocaleString()} out of ${totalAsked.toLocaleString()} ALGO awarded`}</Typography>
              <Typography className="mb-3">{`${(totalAsked - totalAwarded).toLocaleString()} ALGO remaining`}</Typography>
            </div>
          </Box>
        )}
      </div>
    )
  }
  return null
}

export default AlgoStats
