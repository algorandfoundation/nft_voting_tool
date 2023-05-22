import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import { Chip } from '@mui/material'

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
    avatar={<CheckCircleIcon className="text-green" />}
  />
)

export const DidNotPassChip = () => (
  <Chip
    className="mr-2 border-red bg-red-light rounded-lg border border-solid"
    label="Did not pass"
    avatar={<CancelIcon className="text-red" />}
  />
)

export const OpenChip = () => <Chip className="mr-2 border-green bg-green-light rounded-lg border border-solid" label="Open" />

export const OpeningSoonChip = () => (
  <Chip className="mr-2 border-yellow bg-yellow-light rounded-lg border border-solid" label="Opening Soon" />
)

export const ClosedChip = () => <Chip className="mr-2 border-red bg-red-light rounded-lg border border-solid" label="Closed" size="small" />

export const YouHaveNotVotedChip = ({ isSmall = false }) => (
  <Chip
    className="mr-2 border-red bg-red-light rounded-lg border border-solid"
    label="You haven't voted"
    size={isSmall ? 'small' : 'medium'}
    avatar={<ErrorIcon className="text-red" />}
  />
)

export const YouVotedChip = ({ isSmall = false }) => (
  <Chip
    className="mr-2 border-green bg-green-light rounded-lg border border-solid"
    label="You voted"
    size={isSmall ? 'small' : 'medium'}
    avatar={<CheckCircleIcon className="text-green" />}
  />
)

export const MockProposalChip = () => <Chip className="mr-2 border-red bg-red-light rounded-lg border border-solid" label="Mock proposal" />

export const AbstainChip = () => <Chip className="mr-2 bg-red-light rounded-lg" label="Abstain" />

export const CategoryChip = ({ category }: Props) => {
  const component = renderComponent(category)
  return component
}
