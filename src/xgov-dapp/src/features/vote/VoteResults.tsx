import { Skeleton, Typography } from '@mui/material'
import { VotingRoundMetadata } from '../../../../dapp/src/shared/IPFSGateway'
import { VotingRoundGlobalState } from '../../../../dapp/src/shared/VotingRoundContract'
import { ProposalCard } from '../../shared/ProposalCard'
import { VotingRoundResult } from '../../shared/types'
import { VoteDetails } from './VoteDetails'
import { VotingTime } from './VotingTime'

type VoteResultsProps = {
  votingRoundResults: VotingRoundResult[] | undefined
  votingRoundMetadata: VotingRoundMetadata | undefined
  votingRoundGlobalState: VotingRoundGlobalState
  isLoadingVotingRoundData: boolean
  isLoadingVotingRoundResults: boolean
  myVotes?: string[]
}

export const VoteResults = ({
  votingRoundResults,
  votingRoundMetadata,
  votingRoundGlobalState,
  isLoadingVotingRoundData,
  isLoadingVotingRoundResults,
}: VoteResultsProps) => {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="col-span-1 sm:col-span-2">
          <Typography variant="h3">{votingRoundMetadata?.title} - Results</Typography>
        </div>
        <div>
          <VoteDetails
            globalState={votingRoundGlobalState}
            appId={votingRoundGlobalState.appId}
            loading={isLoadingVotingRoundData}
            roundMetadata={votingRoundMetadata}
          />
        </div>
        <div></div>
        <div></div>
        <div>
          <VotingTime className="sm:visible" globalState={votingRoundGlobalState} loading={isLoadingVotingRoundData} />
        </div>
        <div className="col-span-1 sm:col-span-3">
          <Typography variant="h4">Proposals</Typography>
        </div>
        {isLoadingVotingRoundData ||
          (isLoadingVotingRoundResults && (
            <>
              <div>
                <Skeleton className="h-40 mb-4" variant="rectangular" />
              </div>
              <div>
                <Skeleton className="h-40 mb-4" variant="rectangular" />
              </div>
              <div>
                <Skeleton className="h-40" variant="rectangular" />
              </div>
            </>
          ))}
        {!isLoadingVotingRoundResults &&
          votingRoundMetadata?.questions.map((question, index) => (
            <div>
              {question.metadata && (
                <ProposalCard
                  title={question.prompt}
                  description={question.description}
                  category={question.metadata.category}
                  focus_area={question.metadata.focus_area}
                  link={question.metadata.link}
                  threshold={question.metadata.threshold}
                  ask={question.metadata.ask}
                  votesTally={votingRoundResults && votingRoundResults[index] ? votingRoundResults[index].count : 0}
                  hasClosed={true}
                />
              )}
            </div>
          ))}
      </div>
    </div>
  )
}
