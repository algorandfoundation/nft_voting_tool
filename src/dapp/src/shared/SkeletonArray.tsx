import { Skeleton, Stack } from '@mui/material'
import range from 'lodash.range'

type SkeletonArrayProps = {
  className: string
  count: number
}

export const SkeletonArray = ({ className, count }: SkeletonArrayProps) => (
  <Stack spacing={1}>
    {range(0, count + 1).map((ix) => (
      <Skeleton key={ix} className={className} variant="rectangular" />
    ))}
  </Stack>
)
