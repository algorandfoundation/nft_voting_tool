import { CheckCircleIcon, ExclamationCircleIcon, MegaphoneIcon } from '@heroicons/react/24/solid'
import { Chip, ChipProps } from '@mui/material'
import clsx from 'clsx'

interface Props {
  category: string
}

enum Category {
  dApps = 'dApps',
  Tools = 'Tools',
  Community = 'Community',
}

const renderComponent = (category: string) => {
  switch (category.toLowerCase()) {
    case Category.dApps.toLowerCase():
      return (
        <Chip
          style={{
            borderRadius: '8px',
            backgroundColor: '#E9E8FF',
          }}
          label={Category.dApps}
        />
      )
    case Category.Tools.toLowerCase():
      return (
        <Chip
          style={{
            borderRadius: '8px',
            backgroundColor: '#FFE9FD',
          }}
          label={Category.Tools}
        />
      )
    case Category.Community.toLowerCase():
      return (
        <Chip
          style={{
            borderRadius: '8px',
            backgroundColor: '#D7F0FF',
          }}
          label={Category.Community}
        />
      )
    default:
      return null
  }
}

export const PassedChip = () => (
  <Chip
    className="mr-2 border-green bg-green-light rounded-lg border border-solid"
    label="Passed"
    avatar={<CheckCircleIcon className="h-5 w-5 text-green" />}
  />
)

export const VotesNeededToPassChip = ({ votesNeeded }: { votesNeeded: number }) => (
  <Chip
    className="mr-2 border-yellow bg-yellow-light rounded-lg border border-solid"
    label={`${votesNeeded.toLocaleString()} votes needed to pass`}
    avatar={<MegaphoneIcon className="h-5 w-5 text-yellow" />}
  />
)

export const DidNotPassChip = () => (
  <Chip
    className="mr-2 border-red bg-red-light rounded-lg border border-solid"
    label="Did not pass"
    avatar={<ExclamationCircleIcon className="h-5 w-5 text-red" />}
  />
)

export const OpenChip = () => <Chip className="mr-2 border-green bg-green-light rounded-lg border border-solid" label="Open" />

export const OpeningSoonChip = ({ isSmall = false, isWhite = false }) => (
  <Chip
    size={isSmall ? 'small' : 'medium'}
    className={clsx('mr-2 border-yellow rounded-lg border border-solid', isWhite ? 'bg-white' : 'bg-yellow-light')}
    label="Opening Soon"
  />
)

export const ClosedChip = () => <Chip className="mr-2 border-red bg-red-light rounded-lg border border-solid" label="Closed" size="small" />

export const YouHaveNotVotedChip = ({ isSmall = false }) => (
  <Chip
    className="mr-2 border-red bg-red-light rounded-lg border border-solid"
    label="You haven't voted"
    size={isSmall ? 'small' : 'medium'}
    avatar={<ExclamationCircleIcon className="h-5 w-5 text-red" />}
  />
)

export const YouVotedChip = ({ isSmall = false, isWhite = false }) => (
  <Chip
    className={clsx('mr-2 border-green rounded-lg border border-solid', isWhite ? 'bg-white' : 'bg-green-light')}
    label="You voted"
    size={isSmall ? 'small' : 'medium'}
    avatar={<CheckCircleIcon className="h-5 w-5 text-green" />}
  />
)

export const YouDidNotVoteChip = () => (
  <Chip
    className="mr-2 border-red bg-white rounded-lg border border-solid"
    label="You did not vote"
    size="small"
    avatar={<ExclamationCircleIcon className="h-5 w-5 text-red" />}
  />
)

export const MockProposalChip = () => <Chip className="mr-2 border-red bg-red-light rounded-lg border border-solid" label="Mock proposal" />

export const AbstainChip = () => <Chip className="mr-2 bg-red-light rounded-lg" label="Abstain" />

export const CategoryChip = ({ category }: Props) => {
  const component = renderComponent(category)
  return component
}

const FILTER_CHIP_COLORS: { [k: string]: string } = {
  Onboarding: '#FFE9FD',
}
export function FilterChip(props: ChipProps) {
  return (
    <Chip
      style={{
        borderRadius: '8px',
        backgroundColor: typeof props.label === 'string' ? FILTER_CHIP_COLORS[props.label] : '#D7F0FF',
      }}
      {...props}
    />
  )
}
