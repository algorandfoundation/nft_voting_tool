import { Button, Stack } from '@mui/material'
import { useState } from 'react'
import { VotingRound } from '../../shared/types'
import { getVoteEnded, getVoteStarted } from '../../shared/vote'

type VoteSubmissionProps = {
  round: VotingRound
  handleSubmitVote: (selectedOption: string) => void
}

export const VoteSubmission = ({ round, handleSubmitVote }: VoteSubmissionProps) => {
  const [vote, setVote] = useState<number | null>(null)
  const voteStarted = getVoteStarted(round)
  const voteEnded = getVoteEnded(round)
  return (
    <>
      <Stack spacing={1} className="max-w-xs">
        {round.answers.map((answer, ix) => (
          <Button
            disabled={!voteStarted}
            variant={vote === ix ? 'contained' : 'outlined'}
            key={ix}
            onClick={() => setVote(ix)}
            className="w-full uppercase"
          >
            {answer}
          </Button>
        ))}
      </Stack>
      {!voteEnded && voteStarted && (
        <Button
          disabled={vote === null}
          onClick={() => {
            if (vote === null) return
            handleSubmitVote(round.answers[vote])
          }}
          className="uppercase mt-4"
          variant="contained"
        >
          Submit vote
        </Button>
      )}
    </>
  )
}
