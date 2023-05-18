import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LaunchIcon from '@mui/icons-material/Launch'
import { Chip, LinearProgress, Link, Paper, Typography } from '@mui/material'
import { CategoryChip } from './CategoryChip'

type ProposalCardProps = {
  link: string | undefined
  title: string
  description?: string
  category: string | undefined
  focus_area: string | undefined
  threshold: number | undefined
  ask: number | undefined
  votesTally: number | undefined
  hasClosed?: boolean
}

export const ProposalCard = ({
  link,
  title,
  description,
  category,
  focus_area,
  threshold,
  ask,
  votesTally = 0,
  hasClosed = false,
}: ProposalCardProps) => {
  const percentage = threshold && threshold > 0 ? Math.min(100, (votesTally / threshold) * 100) : 100
  const hasPassed = percentage >= 100
  return (
    <Paper elevation={0} className="p-5">
      <div className="flex justify-between">
        <div>
          {hasPassed && (
            <Chip
              className="mr-2 border-green bg-green-light rounded-lg border border-solid"
              label="Passed"
              avatar={<CheckCircleIcon className="text-green" />}
            />
          )}
          {hasClosed && !hasPassed && (
            <Chip
              className="mr-2 border-red bg-red-light rounded-lg border border-solid"
              label="Did not pass"
              avatar={<CancelIcon className="text-red" />}
            />
          )}
        </div>
        <div className="text-right">
          {focus_area && <Chip className="rounded-lg mr-2" label={focus_area} />}
          {category && <CategoryChip category={category} />}
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
          {threshold && `${votesTally.toLocaleString()} of ${threshold.toLocaleString()} Votes`}
        </Typography>
        <Typography className="mb-2" variant="h6">
          {hasClosed && hasPassed && ask && <strong>{`${ask.toLocaleString()} ALGO awarded`}</strong>}
          {!hasClosed && ask && <strong>{`${ask.toLocaleString()} ALGO asked`}</strong>}
        </Typography>
      </div>
      <LinearProgress color="success" style={{ height: 8, borderRadius: 10 }} className="mb-4" variant="determinate" value={percentage} />
      {description && <Typography>{description}</Typography>}
    </Paper>
  )
}
