import { Alert, Button, Stack, Typography } from '@mui/material'
import { useReducer } from 'react'
import { VotingRoundMetadata } from '../../../../dapp/src/shared/IPFSGateway'
import { VotingRoundGlobalState } from '../../../../dapp/src/shared/VotingRoundContract'
import { SkeletonArray } from '../../shared/SkeletonArray'
import { VoteResults } from './VoteResults'

type VoteSubmissionProps = {
  roundMetadata: VotingRoundMetadata | undefined
  globalState: VotingRoundGlobalState | undefined
  voteResults:
    | {
        optionId: string
        count: number
      }[]
    | undefined
  loadingVote: boolean
  loadingResults: boolean
  hasVoteStarted: boolean
  hasVoteEnded: boolean
  canVote: boolean
  votingError: string | null
  existingAnswers?: string[]
  handleSubmitVote: (selectedOptions: Record<string, string>) => void
}

export const VoteSubmission = ({
  roundMetadata,
  globalState,
  voteResults,
  loadingVote,
  loadingResults,
  hasVoteStarted,
  hasVoteEnded,
  canVote,
  votingError,
  existingAnswers,
  handleSubmitVote,
}: VoteSubmissionProps) => {
  const [votes, selectOption] = useReducer(
    (options: Record<string, string>, newOption: Record<string, string>) => ({ ...options, ...newOption }),
    {} as Record<string, string>,
  )

  return (
    <>
      {roundMetadata?.questions.map((question) => (
        <div className="mt-7" key={question.id}>
          <Typography variant="h4">{question.prompt}</Typography>

          <Typography>{question.description}</Typography>

          {!existingAnswers && (
            <div className="mt-4">
              {loadingVote ? (
                <SkeletonArray className="max-w-xs" count={1} />
              ) : (
                <>
                  {canVote || !hasVoteStarted ? (
                    <Stack spacing={1} className="max-w-xs">
                      {question.options.map((option) => (
                        <Button
                          disabled={!hasVoteStarted || hasVoteEnded}
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
      {globalState && !!globalState.voter_count && (
        <div className="flex mt-4">
          <Typography className="text-grey">Number of wallets voted</Typography>
          <Typography className="ml-4">{globalState.voter_count.toLocaleString()}</Typography>
        </div>
      )}
      {votingError && (
        <Alert className="max-w-xl mt-4 text-white bg-red-600 font-semibold" icon={false}>
          <Typography>Could not cast vote:</Typography>
          <Typography>{votingError}</Typography>
        </Alert>
      )}
      {!hasVoteEnded && hasVoteStarted && !existingAnswers && canVote && roundMetadata?.questions && (
        <Button
          disabled={Object.keys(votes).length < roundMetadata.questions.length}
          onClick={() => {
            if (Object.keys(votes).length < roundMetadata.questions.length) return
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
