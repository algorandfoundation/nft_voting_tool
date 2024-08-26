import { Box, Typography } from '@mui/material'

function InformationBox() {
  return (
    <Box className="bg-white flex rounded-xl px-4 py-6">
      <div className="w-full">
        <Typography className="mb-3">
          <strong>Voting Sessions</strong>
        </Typography>
        <Typography>
          Your xGov Current Balance is equal to the sum of the Governance Rewards of the periods you opted in to xGov plus your Term Pool
          forfeited Algo share. It is displayed in µA (or microAlgo) because smart contracts cannot handle decimal numbers. You will receive
          your Deposit, plus the forfeited Algo share, after 12 months from the commitment.
        </Typography>
      </div>
    </Box>
  )
}

export default InformationBox
