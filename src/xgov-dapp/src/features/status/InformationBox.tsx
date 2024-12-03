import { Box, Typography } from '@mui/material'

function InformationBox() {
  return (
    <Box className="bg-white flex rounded-xl px-4 py-6">
      <div className="w-full">
        <Typography className="my-3">
          <strong>*** IMPORTANT UPDATE ***</strong>
        </Typography>
        <Typography className="my-3">
          GP12 Voting Measure 1 established a new xGov enrolment methodology for use when we relaunch the xGov platform later this year.
          Consequently, there was no need to keep Algo locked in Term Pools 2, 3 and 4. All funds were distributed to eligible xGovs on 9
          October 2024, and Term Pools 2, 3, and 4 are now closed.
        </Typography>
        <Typography className="mb-3">
          <strong>Voting Sessions</strong>
        </Typography>
        <Typography className="my-3">All voting sessions for the pilot's Alpha phase have been completed.</Typography>
        <Typography>
          During the Alpha phase governors were required to vote to maintain eligibility. If you missed a vote your eligibility was revoked.
          For each Voting Session, the Voting Status confirms eligibility, where:
        </Typography>
        <Typography>You voted = Eligible</Typography>
        <Typography>You didn't vote = Not eligible</Typography>
        <Typography className="my-3">
          At the end of the Term Pool, the Algo forfeited by the ineligible xGovs are distributed amongst all eligible xGovs.
        </Typography>
        <Typography className="my-3">
          <strong>Term Pools</strong>
        </Typography>
        <Typography>
          Term pool (TP) funds are held by the Algorand Foundation for 12 months from inception. Once a Term Pool matures the funds are
          transferred to the original wallet used in governance or, if indicated at the time of commitment, to the governor's controller
          address.
        </Typography>
        <Typography className="my-3">
          The Duration column displays the creation and maturation dates for each term pool. Once a term pool matures, funds are distributed
          within 14 days.
        </Typography>
      </div>
    </Box>
  )
}

export default InformationBox
