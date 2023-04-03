import { Card, CardContent, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { VotingRoundPopulated } from '../../shared/types'
import { VotingRoundStatus } from './VotingRoundStatus'

export type VotingRoundTileProps = {
  round: VotingRoundPopulated
}

export const VotingRoundTile = ({ round }: VotingRoundTileProps) => {
  return (
    <Link className="no-underline" to={`/vote/${round.id}`}>
      <Card className="cursor-pointer">
        <CardContent className="p-2 sm:p-6">
          <div className="text-start: sm:text-center pt-4 pb-3.5 sm:pb-12">
            <Typography variant="h5" className="font-semibold text-base sm:text-xl">
              {round.title}
            </Typography>
          </div>
          <VotingRoundStatus round={round} />
        </CardContent>
      </Card>
    </Link>
  )
}
