import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'
import { Box, Button, Skeleton, Typography } from '@mui/material'

function EligibilityStatus({ isEligible, isLoading }: { isEligible: boolean; isLoading: boolean }) {
  if (isLoading) {
    return <Skeleton className="h-40 w-full" variant="rectangular" />
  }
  if (isEligible) {
    return (
      <Box className="flex rounded-xl px-4 py-6 bg-green-light">
        <div>
          <CheckCircleIcon className="h-7 w-7 mr-3 -mt-1 text-green" />
        </div>
        <div className="w-full">
          <Typography className="mb-3">
            <strong>You're an elegible xgov</strong>
          </Typography>
          <Typography>Remember to continue voting to maintain your xGov eligibility.</Typography>
        </div>
      </Box>
    )
  } else {
    return (
      <Box className="rounded-xl px-4 py-6 bg-red-light">
        <div className="w-full flex align-bottom">
          <XCircleIcon className="h-7 w-7 mr-3 -mt-1 text-red" />
          <Typography className="mb-3">
            <strong>You’re no longer an eligible xGov</strong>
          </Typography>
          <div className="-mt-1 ml-auto">
            <Button variant="contained" color="info" size="small">
              Re-Enroll
            </Button>
          </div>
        </div>
        <div className="w-full">
          <Typography>You did not vote in the most recent voting session, so your xGov status has been revoked.</Typography>
        </div>
      </Box>
    )
  }
}

export default EligibilityStatus
