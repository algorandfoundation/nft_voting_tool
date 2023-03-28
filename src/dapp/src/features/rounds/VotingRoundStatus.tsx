import { Chip, Typography } from '@mui/material'
import clsx from 'clsx'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { VotingRound } from '../../shared/types'
import { getVoteEnded, getVoteStarted } from '../../shared/vote'
import { VotingRoundTileProps } from './VotingRoundTile'
dayjs.extend(relativeTime)

const getStatus = (round: VotingRound) => {
  const voteStarted = getVoteStarted(round)
  const voteEnded = getVoteEnded(round)
  if (voteStarted) {
    if (voteEnded) {
      return { label: 'Closed', className: 'bg-algorand-vote-closed', date: `Ended ${dayjs(round.end).format('D MMMM YYYY')}` }
    }
    return { label: 'Open', className: 'bg-algorand-vote-open', date: `Ends in ${dayjs(round.end).fromNow()}` }
  }
  return { label: 'Upcoming', className: 'bg-algorand-arctic-lime', date: `Opens ${dayjs(round.start).format('D MMMM YYYY')}` }
}

export const VotingRoundStatus = ({ round }: VotingRoundTileProps) => {
  const { label, className, date } = getStatus(round)

  return (
    <div className="flex justify-between items-center">
      <Chip
        className={clsx('rounded uppercase text-[8px] sm:text-xs h-4 sm:h-8', className)}
        label={label}
        sx={({ breakpoints }) => ({
          '& .MuiChip-label': {
            [breakpoints.down('md')]: {
              padding: 0.5,
            },
            [breakpoints.up('md')]: {
              padding: 1,
            },
          },
        })}
      />

      <Typography className="text-[8px] sm:text-base" variant="body1">
        {date}
      </Typography>
    </div>
  )
}
