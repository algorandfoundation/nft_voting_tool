import { Typography } from '@mui/material'
import { VotingRoundPopulated } from '../../shared/types'
import { NoRounds } from './NoRounds'
import { VotingRoundTile } from './VotingRoundTile'
import { VotingRoundTileLoading } from './index'

type VotingRoundSectionProps = {
  label: string
  rounds: VotingRoundPopulated[]
  loading: boolean
}

export const VotingRoundSection = ({ label, rounds, loading }: VotingRoundSectionProps) => {
  return (
    <>
      <Typography className="mb-3 mt-7" variant="h4">
        {label}
      </Typography>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 md:gap-8">
        {loading ? (
          <VotingRoundTileLoading />
        ) : !rounds.length ? (
          <NoRounds label={label.toLowerCase()} />
        ) : (
          rounds.map((round) => <VotingRoundTile key={round.id} round={round} />)
        )}
      </div>
    </>
  )
}
