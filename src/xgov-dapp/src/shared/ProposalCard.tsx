import { Card, Chip, LinearProgress, Link, Paper, Typography } from '@mui/material'
import LaunchIcon from '@mui/icons-material/Launch'
import { CategoryChip } from './CategoryChip'

type ProposalCardProps = {
  link: string
  title: string
  description: string
  threshold: number
  votesTally: number
  category: string
}

export const ProposalCard = ({ link, title, description, threshold, votesTally, category }: ProposalCardProps) => {
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
            />
          )}
          <CategoryChip category={category} />
        </div>
        <div className="text-right">
          <Link href={link} target="_blank">
            <LaunchIcon />
          </Link>
        </div>
      </div>

      <Typography className="mt-3 mb-3" variant="h5">
        {title}
      </Typography>
      <Typography className="mb-2" variant="h6">
        {votesTally.toLocaleString()} of {threshold.toLocaleString()} Votes
      </Typography>
      <LinearProgress color="success" style={{ height: 8, borderRadius: 10 }} className="mb-4" variant="determinate" value={percentage} />
      <Typography>{description}</Typography>
    </Paper>
  )
}
