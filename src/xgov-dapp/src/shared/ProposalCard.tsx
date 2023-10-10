import LaunchIcon from '@mui/icons-material/Launch'
import { Chip, LinearProgress, Link, Paper, Typography } from '@mui/material'
import { AbstainChip, CategoryChip, DidNotPassChip, MockProposalChip, PassedChip, VotesNeededToPassChip } from './Chips'

export type ProposalCardProps = {
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
  const votesNeeded = threshold && threshold > 0 ? threshold - votesTally : 0

  if (category === 'Abstain') {
    return (
      <Paper elevation={0} className="p-5">
        <div className="flex justify-between">
          <div>
            <MockProposalChip />
          </div>
          <div className="text-right">
            <AbstainChip />
          </div>
        </div>

        <Typography className="mt-3 mb-3" variant="h5">
          {title}
        </Typography>
        <div className="flex justify-between">
          <Typography className="mb-2" variant="h6">
            {`${votesTally.toLocaleString()} Votes`}
          </Typography>
          <Typography className="mb-2" variant="h6">
            {!hasClosed && <strong>0 ALGO asked</strong>}
          </Typography>
        </div>
        <LinearProgress color="error" style={{ height: 8, borderRadius: 10 }} className="mb-4" variant="determinate" value={100} />
        {description && <Typography>{description}</Typography>}
      </Paper>
    )
  }

  return (
    <Paper elevation={0} className="p-5">
      <div className="flex justify-between">
        <div>
          {hasPassed && <PassedChip />}
          {hasClosed && !hasPassed && <DidNotPassChip />}
          {!hasClosed && !hasPassed && votesNeeded > 0 && <VotesNeededToPassChip votesNeeded={votesNeeded} />}
        </div>
        <div className="text-right">
          <span className="hidden md:inline-block">
            {focus_area && <Chip className="rounded-lg mr-2" label={focus_area} />}
            {category && <CategoryChip category={category} />}
          </span>
          <Link className="text-grey-light align-text-top ml-2 inline-block" href={link} target="_blank">
            <LaunchIcon />
          </Link>
        </div>
      </div>
      <div className="md:hidden mt-2">
        {focus_area && <Chip className="rounded-lg mr-2" label={focus_area} />}
        {category && <CategoryChip category={category} />}
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
