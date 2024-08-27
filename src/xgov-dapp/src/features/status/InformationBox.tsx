import { Box, Typography } from '@mui/material'

function InformationBox() {
  return (
    <Box className="bg-white flex rounded-xl px-4 py-6">
      <div className="w-full">
        <Typography className="mb-3">
          <strong>Voting Sessions</strong>
        </Typography>
        <Typography>
          During the Alpha phase governors were required to vote to maintain eligibility. If you missed a vote your eligibility was revoked.
          For each Voting Session, the Voting Status confirms eligibility, where: You voted = Eligible You didn't vote = Not eligible At the
          end of the Term Pool, the Algos forfeited by the ineligible xGovs are distributed amongst all eligible xGovs.
        </Typography>

        <Typography className="my-3">
          <strong>Term Pools</strong>
        </Typography>
        Term pools (TP) funds are held by the Algorand Foundation for 12 months from inception. Once a Term Pool matures the funds are
        transferred to the original wallet used in governance or, if indicated at the time of commitment, to the governor's controller
        address. The Duration column displays the creation and maturation dates for each term pool. Once a term pool matures, funds are
        distributed within 14 days.
      </div>
    </Box>
  )
}

export default InformationBox
