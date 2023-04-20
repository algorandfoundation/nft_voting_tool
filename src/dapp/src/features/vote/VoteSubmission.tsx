import { Button, Stack } from '@mui/material'
import { useReducer } from 'react'
import { VotingRoundPopulated } from '../../shared/types'
import { getVoteEnded, getVoteStarted } from '../../shared/vote'

type VoteSubmissionProps = {
  round: VotingRoundPopulated
  existingAnswers?: string[]
  handleSubmitVote: (selectedOptions: Record<string, string>) => void
}

export const VoteSubmission = ({ round, existingAnswers, handleSubmitVote }: VoteSubmissionProps) => {
  const [votes, selectOption] = useReducer(
    (options: Record<string, string>, newOption: Record<string, string>) => ({ ...options, ...newOption }),
    {} as Record<string, string>,
  )
  const voteStarted = getVoteStarted(round)
  const voteEnded = getVoteEnded(round)
  return (
    <>
      <Stack spacing={1} className="max-w-xs">
        {round.questions.map((question) => (
          <>
            {question.prompt}
            {question.options.map((option) => (
              <Button
                disabled={!voteStarted || !!existingAnswers}
                variant={Object.values(votes).includes(option.id) || existingAnswers?.includes(option.id) ? 'contained' : 'outlined'}
                key={option.id}
                onClick={() => selectOption({ [question.id]: option.id })}
                className="w-full uppercase"
              >
                {option.label}
              </Button>
            ))}
          </>
        ))}
      </Stack>
      {!voteEnded && voteStarted && !existingAnswers && (
        <Button
          disabled={votes === null}
          onClick={() => {
            if (votes === null) return
            handleSubmitVote(votes)
          }}
          className="uppercase mt-4"
          variant="contained"
        >
          Submit votes
        </Button>
      )}
    </>
  )
}
