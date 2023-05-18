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

export const CategoryChip = ({ category }: Props) => {
  const component = renderComponent(category)
  return component
}
