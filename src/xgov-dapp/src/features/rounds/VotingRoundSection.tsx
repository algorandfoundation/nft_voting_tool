import { Typography } from '@mui/material'
import clsx from 'clsx'
import { VotingRoundGlobalState } from '../../../../dapp/src/shared/VotingRoundContract'
import { NoRounds } from './NoRounds'
import { VotingRoundStatus, VotingRoundTile } from './VotingRoundTile'
import { VotingRoundTileLoading } from './index'

type VotingRoundSectionProps = {
  label: string
  globalStates: VotingRoundGlobalState[]
  votingRoundStatus: VotingRoundStatus
  loading: boolean
}

export const VotingRoundSection = ({ label, globalStates, votingRoundStatus, loading }: VotingRoundSectionProps) => {
  return (
    <>
      <Typography className="mb-3 mt-7" variant="h4">
        {label}
      </Typography>
      <div
        className={clsx(
          'grid grid-cols-1 gap-3 md:gap-8',
          votingRoundStatus === VotingRoundStatus.CLOSED ? 'sm:grid-cols-3' : 'sm:grid-cols-1',
        )}
      >
        {loading ? (
          <VotingRoundTileLoading />
        ) : !globalStates.length ? (
          <NoRounds label={label.toLowerCase()} />
        ) : (
          globalStates.map((globalState) => (
            <VotingRoundTile key={globalState.appId} globalState={globalState} votingRoundStatus={votingRoundStatus} />
          ))
        )}
      </div>
    </>
  )
}
