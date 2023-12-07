import { BoltIcon } from '@heroicons/react/24/solid'
import { Typography } from '@mui/material'
import { Box } from '@mui/system'

export const VotingInstructions = ({ voteWeight }: { voteWeight: number }) => {
  return (
    <Box className="bg-yellow-light flex rounded-xl px-4 py-6">
      <div>
        <BoltIcon className="h-6 w-6 mr-3 text-yellow" />
      </div>
      <div>
        <Typography className="mb-3">
          <strong>Voting instructions</strong>
        </Typography>
        <Typography className="mb-3">
          Select the projects you wish to vote for.
        </Typography>
        <Typography>
          <strong>Once you cast your vote, you cannot change them.</strong>
        </Typography>
      </div>
    </Box>
  )
}
