import { Chip, Typography } from '@mui/material'
import clsx from 'clsx'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { VotingRoundGlobalState } from '../../../../dapp/src/shared/VotingRoundContract'
import { getHasVoteEnded, getHasVoteStarted } from '../../shared/vote'
dayjs.extend(relativeTime)

const getStatus = (globalState: VotingRoundGlobalState) => {
  const voteStarted = getHasVoteStarted(globalState)
  const voteEnded = getHasVoteEnded(globalState)
  if (voteEnded) {
    return { label: 'Closed', className: 'bg-algorand-vote-closed', date: `Ended ${dayjs(globalState.end_time).format('D MMMM YYYY')}` }
  }
  if (voteStarted) {
    return { label: 'Open', className: 'bg-algorand-vote-open', date: `Ends in ${dayjs(globalState.end_time).fromNow()}` }
  }
  return { label: 'Upcoming', className: 'bg-algorand-arctic-lime', date: `Opens ${dayjs(globalState.start_time).format('D MMMM YYYY')}` }
}

export const VotingRoundStatus = ({ globalState }: { globalState: VotingRoundGlobalState }) => {
  const { label, className, date } = getStatus(globalState)

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
