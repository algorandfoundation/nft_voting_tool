import { Typography } from '@mui/material'

type NoRoundsProps = {
  label: string
}
export const NoRounds = ({ label }: NoRoundsProps) => <Typography>There are no {label} events.</Typography>
