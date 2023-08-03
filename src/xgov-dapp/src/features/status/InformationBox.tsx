import { Box, Typography } from '@mui/material'

function InformationBox() {
  return (
    <Box className="bg-white flex rounded-xl px-4 py-6">
      <div className="w-full">
        <Typography className="mb-3">
          <strong>Voting Sessions</strong>
        </Typography>
        <Typography>
          In this version of the xGov Voting Tool, <strong>you can vote one time only</strong>. Be sure to check your vote allocation before
          submitting your vote.
        </Typography>
        <Typography className="mt-4 mb-3">
          <strong>Maintaining your xGov eligilbility</strong>
        </Typography>
        <Typography>
          <strong>Your xGov duty is to vote in all voting sessions during the 12 months of the Term Pool duration.</strong> That maintains
          your eligibility to receive the Algo deposit (your original governance rewards) back at the end of the term pool.{' '}
        </Typography>
        <Typography>
          <br />
          <strong>You will become ineligible if fail to vote on a session.</strong> If you are stacking voting power by participating in
          more than one Term Pool simultaneously, and miss a voting session, the total of Algos across all pools will be forfeited.
        </Typography>
        <Typography>
          <br />
          At the end of the Term Pool, the Algos forfeited by the ineligible xGovs will be distributed amongst all eligible xGovs.
        </Typography>
        <Typography className="mt-4 mb-4">
          <strong>Your xGov Deposit</strong>
        </Typography>
        <Typography>
          Your xGov deposit is equal to the governance rewards of the period you opted in to xGov. It is displayed in µA (or microAlgo)
          because smart contracts cannot handle decimal numbers. Your xGov deposit plus your Term Pool forfeited Algo share will be your
          payout in 12 months, if you remain eligible.
        </Typography>
      </div>
    </Box>
  )
}

export default InformationBox
