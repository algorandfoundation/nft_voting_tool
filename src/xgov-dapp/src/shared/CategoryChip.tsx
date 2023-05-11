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
            backgroundColor: 'rgba(218, 215, 254, 1)',
          }}
          label={Category.dApps}
        />
      )
    case Category.Tools.toLowerCase():
      return (
        <Chip
          style={{
            borderRadius: '8px',
            backgroundColor: 'rgba(218, 228, 224, 1)',
          }}
          label={Category.Tools}
        />
      )
    case Category.Community.toLowerCase():
      return (
        <Chip
          style={{
            borderRadius: '8px',
            backgroundColor: 'rgba(204, 248, 254, 1)',
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
