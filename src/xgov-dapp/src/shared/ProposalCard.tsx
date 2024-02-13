import { useState } from 'react'
import LaunchIcon from '@mui/icons-material/Launch'
import { Chip, Collapse, LinearProgress, Link, Paper, Typography } from '@mui/material'
import { AbstainChip, CategoryChip, DidNotPassChip, MockProposalChip, PassedChip, VotesNeededToPassChip } from './Chips'
import { useOverflow } from './hooks/useOverflow'

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
  forcePass?: boolean
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
  forcePass = false,
}: ProposalCardProps) => {
  // Handle collapse state
  const [isOverflow, setIsOverflow] = useState(false)
  const { ref } = useOverflow((result) => {
    if (result !== isOverflow) setIsOverflow(result)
  })
  const [hasOpened, setHasOpened] = useState(false)
  const [expanded, setExpanded] = useState(false)
  // Derived State
  const percentage = threshold && threshold > 0 ? Math.min(100, (votesTally / threshold) * 100) : 100
  const hasPassed = percentage >= 100 || forcePass
  const votesNeeded = threshold && threshold > 0 ? threshold - votesTally : 0

  function handleClick() {
    if (!hasOpened) setHasOpened(true)
    setExpanded(!expanded)
  }

  if (category === 'Abstain' || category === 'Mock') {
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
        {description && (
          <Collapse ref={ref} collapsedSize={isOverflow || hasOpened ? `${1.5 * 4}rem` : `${1.5 * 4 + 2}rem`} in={expanded}>
            <Typography>{description}</Typography>
          </Collapse>
        )}
        {(isOverflow || hasOpened) && (
          <Typography className="text-right mt-2 cursor-pointer" onClick={handleClick}>
            {expanded ? 'Show Less' : 'Read More'}
          </Typography>
        )}
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
      {description && (
        <Collapse ref={ref} collapsedSize={isOverflow || hasOpened ? `${1.5 * 4}rem` : `${1.5 * 4 + 2}rem`} in={expanded}>
          <Typography dangerouslySetInnerHTML={{ __html: description }}></Typography>
        </Collapse>
      )}
      {(isOverflow || hasOpened) && (
        <Typography className="text-right mt-2 cursor-pointer" onClick={handleClick}>
          {expanded ? 'Show Less' : 'Read More'}
        </Typography>
      )}
    </Paper>
  )
}
