import FlashOnIcon from '@mui/icons-material/FlashOn'
import { Typography } from '@mui/material'
import { Box } from '@mui/system'

export const VotingInstructions = ({ voteWeight }: { voteWeight: number }) => {
  return (
    <Box className="bg-yellow-light flex rounded-xl px-4 py-6">
      <div>
        <FlashOnIcon className="align-bottom mr-4 text-yellow" />
      </div>
      <div>
        <Typography className="mb-3">
          <strong>Voting instructions</strong>
        </Typography>
        <Typography className="mb-3">Your voting power is determined by your current ALGO balance committed to xGov.</Typography>
        <Typography className="mb-3">
          For this session, your voting power is <strong>{voteWeight.toLocaleString()} Votes</strong>.
        </Typography>
        <Typography className="mb-3">
          Please distribute <strong>percentages</strong> of your voting power to your selected proposals below, totalling to{' '}
          <strong>100%</strong>.
        </Typography>
        <Typography>
          <strong>Once you cast your votes, you cannot change them.</strong>
        </Typography>
      </div>
    </Box>
  )
}
