import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LaunchIcon from '@mui/icons-material/Launch'
import { Chip, LinearProgress, Link, Paper, Typography } from '@mui/material'
import { CategoryChip } from './CategoryChip'

type ProposalCardProps = {
  link: string
  title: string
  description?: string
  category: string
  focus_area: string
  threshold: number
  ask: number
  votesTally: number
}

export const ProposalCard = ({ link, title, description, category, focus_area, threshold, ask, votesTally }: ProposalCardProps) => {
  const percentage = threshold > 0 ? Math.min(100, (votesTally / threshold) * 100) : 100
  return (
    <Paper elevation={0} className="p-5">
      <div className="flex justify-between">
        <div>
          {percentage >= 100 && (
            <Chip
              className="mr-2"
              style={{
                border: 'solid',
                borderColor: '#01DC94',
                borderRadius: '8px',
                backgroundColor: '#E2FBD7',
              }}
              label="Passed"
              avatar={<CheckCircleIcon className="text-green" />}
            />
          )}
        </div>
        <div className="text-right">
          <Chip className="rounded-lg mr-2" label={focus_area} />
          <CategoryChip category={category} />
          <Link className="text-grey-light align-text-top ml-2" href={link} target="_blank">
            <LaunchIcon />
          </Link>
        </div>
      </div>

      <Typography className="mt-3 mb-3" variant="h5">
        {title}
      </Typography>
      <div className="flex justify-between">
        <Typography className="mb-2" variant="h6">
          {votesTally.toLocaleString()} of {threshold.toLocaleString()} Votes
        </Typography>
        <Typography className="mb-2" variant="h6">
          <strong>{ask.toLocaleString()} ALGO asked</strong>
        </Typography>
      </div>
      <LinearProgress color="success" style={{ height: 8, borderRadius: 10 }} className="mb-4" variant="determinate" value={percentage} />
      {description && <Typography>{description}</Typography>}
    </Paper>
  )
}
