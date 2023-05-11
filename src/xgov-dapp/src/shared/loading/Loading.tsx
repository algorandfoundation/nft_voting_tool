import { LinearProgress } from '@mui/material'

export type LoadingProps = {
  note?: string
}
export const Loading = ({ note }: LoadingProps) => (
  <>
    <LinearProgress />
    <div className="mt-6">{note}</div>
  </>
)
