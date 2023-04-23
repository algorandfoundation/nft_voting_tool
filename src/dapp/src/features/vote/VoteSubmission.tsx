import { Alert, Button, Stack, Typography } from '@mui/material'
import { useReducer } from 'react'
import { SkeletonArray } from '../../shared/SkeletonArray'
import { VotingRoundPopulated } from '../../shared/types'
import { getVoteEnded, getVoteStarted } from '../../shared/vote'
import { VoteResults } from './VoteResults'

type VoteSubmissionProps = {
  round: VotingRoundPopulated | undefined
  voteResults:
    | {
        optionId: string
        count: number
      }[]
    | undefined
  loadingVote: boolean
  loadingResults: boolean
  canVote: boolean
  votingError: string | null
  existingAnswers?: string[]
  handleSubmitVote: (selectedOptions: Record<string, string>) => void
}

export const VoteSubmission = ({
  round,
  voteResults,
  loadingVote,
  loadingResults,
  canVote,
  votingError,
  existingAnswers,
  handleSubmitVote,
}: VoteSubmissionProps) => {
  const [votes, selectOption] = useReducer(
    (options: Record<string, string>, newOption: Record<string, string>) => ({ ...options, ...newOption }),
    {} as Record<string, string>,
  )
  const voteStarted = round ? getVoteStarted(round) : false
  const voteEnded = round ? getVoteEnded(round) : false
  return (
    <>
      {round?.questions.map((question) => (
        <div className="mt-7" key={question.id}>
          <Typography variant="h4">{question.prompt}</Typography>

          <Typography>{question.description}</Typography>

          {!existingAnswers && (
            <div className="mt-4">
              {loadingVote ? (
                <SkeletonArray className="max-w-xs" count={1} />
              ) : (
                <>
                  {canVote || !voteStarted ? (
                    <Stack spacing={1} className="max-w-xs">
                      {question.options.map((option) => (
                        <Button
                          disabled={!voteStarted || voteEnded}
                          variant={Object.values(votes).includes(option.id) ? 'contained' : 'outlined'}
                          key={option.id}
                          onClick={() => selectOption({ [question.id]: option.id })}
                          className="w-full uppercase"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </Stack>
                  ) : null}
                </>
              )}
            </div>
          )}
          <div className="mt-4">
            {loadingResults ? (
              <SkeletonArray className="max-w-xs" count={4} />
            ) : (
              voteResults && <VoteResults question={question} votingRoundResults={voteResults} myVotes={existingAnswers} />
            )}
          </div>
        </div>
      ))}
      {!!round?.votedWallets && (
        <div className="flex mt-4">
          <Typography className="text-grey">Number of wallets voted</Typography>
          <Typography className="ml-4">{round.votedWallets.toLocaleString()}</Typography>
        </div>
      )}
      {votingError && (
        <Alert className="max-w-xl mt-4 text-white bg-red-600 font-semibold" icon={false}>
          <Typography>Could not cast vote:</Typography>
          <Typography>{votingError}</Typography>
        </Alert>
      )}
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
