import { Skeleton, Typography } from '@mui/material'
import clsx from 'clsx'
import { VotingRoundGlobalState } from '../../../../dapp/src/shared/VotingRoundContract'
import { NoRounds } from './NoRounds'
import { VotingRoundWrapperProps } from './VotingRoundTile'
import VotingRoundTileWrapper from './VotingRoundTile'
import { ComponentType } from 'react'
import { VotingRoundStatus } from './types'

type VotingRoundSectionProps = {
  components?: {
    Tile: ComponentType<VotingRoundWrapperProps>
  }
  label: string
  rounds: VotingRoundGlobalState[]
  status: VotingRoundStatus
  isLoading: boolean
}
const DEFAULT_COMPONENTS = {
  Tile: VotingRoundTileWrapper,
}

/**
 *
 * @param components
 * @param label
 * @param rounds
 * @param status
 * @param isLoading
 * @todo Allow for dynamic components and props array for IoC
 */
export const VotingRoundSection = ({ components = DEFAULT_COMPONENTS, label, rounds, status, isLoading }: VotingRoundSectionProps) => {
  return (
    <>
      <Typography className="mb-3 mt-7" variant="h4">
        {label}
      </Typography>
      <div className={clsx('grid grid-cols-1 gap-3 md:gap-8', status === VotingRoundStatus.CLOSED ? 'lg:grid-cols-3' : 'lg:grid-cols-1')}>
        {isLoading ? (
          <Skeleton className="h-52" variant="rectangular" />
        ) : !rounds.length ? (
          <NoRounds label={label.toLowerCase()} />
        ) : (
          rounds.map((state) => <components.Tile key={state.appId} state={state} status={status} />)
        )}
      </div>
    </>
  )
}
