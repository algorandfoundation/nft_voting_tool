import { useVoter, useVotingRound } from './use-x-gov'
import { useParams } from 'react-router-dom'
import { ComponentType } from 'react'

export function withVotingRoute<T>(Component: ComponentType<T>) {
  return (props: T) => {
    const { voteId } = useParams()

    const { data: round, isLoading, isError, errors, refetch: refetchRound } = useVotingRound(voteId)

    const voter = useVoter(voteId)

    return <Component {...props} round={round} voter={voter} isLoading={isLoading} isError={isError} errors={errors} />
  }
}
