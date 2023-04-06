import { Button, Stack } from '@mui/material'
import { useState } from 'react'
import { VotingRoundPopulated } from '../../shared/types'
import { getVoteEnded, getVoteStarted } from '../../shared/vote'

type VoteSubmissionProps = {
  round: VotingRoundPopulated
  existingAnswer?: string
  handleSubmitVote: (selectedOption: string) => void
}

export const VoteSubmission = ({ round, existingAnswer, handleSubmitVote }: VoteSubmissionProps) => {
  const [vote, setVote] = useState<string | null>(null)
  const voteStarted = getVoteStarted(round)
  const voteEnded = getVoteEnded(round)
  return (
    <>
      <Stack spacing={1} className="max-w-xs">
        {round.questions.map((question) =>
          question.options.map((option) => (
            <Button
              disabled={!voteStarted || !!existingAnswer}
              variant={vote === option.id || existingAnswer === option.id ? 'contained' : 'outlined'}
              key={option.id}
              onClick={() => setVote(option.id)}
              className="w-full uppercase"
            >
              {option.label}
            </Button>
          )),
        )}
      </Stack>
      {!voteEnded && voteStarted && !existingAnswer && (
        <Button
          disabled={vote === null}
          onClick={() => {
            if (vote === null) return
            handleSubmitVote(vote)
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
