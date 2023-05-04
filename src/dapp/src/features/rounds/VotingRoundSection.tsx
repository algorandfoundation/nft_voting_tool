import { Typography } from '@mui/material'
import { VotingRoundGlobalState } from '../../shared/votingRoundContract'
import { NoRounds } from './NoRounds'
import { VotingRoundTile } from './VotingRoundTile'
import { VotingRoundTileLoading } from './index'

type VotingRoundSectionProps = {
  label: string
  globalStates: VotingRoundGlobalState[]
  loading: boolean
}

export const VotingRoundSection = ({ label, globalStates, loading }: VotingRoundSectionProps) => {
  return (
    <>
      <Typography className="mb-3 mt-7" variant="h4">
        {label}
      </Typography>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 md:gap-8">
        {loading ? (
          <VotingRoundTileLoading />
        ) : !globalStates.length ? (
          <NoRounds label={label.toLowerCase()} />
        ) : (
          globalStates.map((globalState) => <VotingRoundTile key={globalState.appId} globalState={globalState} />)
        )}
      </div>
    </>
  )
}
