import { Alert, Button, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { VotingRoundGlobalState } from '../../../../dapp/src/shared/VotingRoundContract'
import { VotingRoundSection } from './VotingRoundSection'
import { VotingRoundStatus } from './types'

export type VotingRoundsProps = {
  isLoading: boolean
  isError: boolean
  error: unknown
  rounds: {
    open: VotingRoundGlobalState[]
    closed: VotingRoundGlobalState[]
    upcoming: VotingRoundGlobalState[]
  }
  creators: string[]
  activeAddress: string | undefined
}
export const VotingRounds = ({ isLoading, isError, error, rounds, creators, activeAddress }: VotingRoundsProps) => {
  const isCreator = activeAddress && (creators.includes(activeAddress) || creators.includes('any'))
  return (
    <div className="container">
      <Typography variant="h3">Voting sessions</Typography>

      {isCreator && (
        <Button component={Link} to="/create" className="my-8" variant="contained">
          Create new voting round
        </Button>
      )}

      {isError && (
        <Alert className="max-w-xl mt-4 text-white bg-red-600 font-semibold" icon={false}>
          <Typography>Could not load voting rounds:</Typography>
          <Typography>{typeof (error as Error)?.message === 'undefined' ? 'Something went wrong' : (error as Error).message}</Typography>
        </Alert>
      )}

      <VotingRoundSection label="Open" rounds={rounds.open} status={VotingRoundStatus.OPEN} isLoading={isLoading} />
      <VotingRoundSection label="Opening soon" rounds={rounds.upcoming} status={VotingRoundStatus.OPENING_SOON} isLoading={isLoading} />
      <VotingRoundSection label="Closed" rounds={rounds.closed} status={VotingRoundStatus.CLOSED} isLoading={isLoading} />
    </div>
  )
}
