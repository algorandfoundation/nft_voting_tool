import FileDownloadIcon from '@mui/icons-material/FileDownload'
import { Alert, Button, Skeleton, Typography } from '@mui/material'
import { saveAs } from 'file-saver'
import Papa from 'papaparse'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { VotingRoundMetadata } from '@/shared/IPFSGateway'
import { VotingRoundGlobalState } from '@/shared/VotingRoundContract'
import { ProposalCard } from '@/shared/ProposalCard'
import { VotingRoundResult } from '@/shared/types'
import { generateOptionIDsToCountsMapping } from '@/utils/common'
import { VoteDetails } from './VoteDetails'
import VotingStats from './VotingStats'
import { VotingTime } from './VotingTime'

export type VoteResultsProps = {
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
  const [isDownloadingProposalsCsv, setIsDownloadingProposalsCsv] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const optionIDsToCounts = votingRoundResults !== undefined ? generateOptionIDsToCountsMapping(votingRoundResults) : {}

  const generateProposalsResultsCsv = async () => {
    if (votingRoundMetadata) {
      setIsDownloadingProposalsCsv(true)
      setError(null)
      try {
        const csvData = Papa.unparse(
          votingRoundMetadata.questions.map((question) => {
            const votesTally =
              question.options.length > 0 && optionIDsToCounts[question.options[0].id] ? optionIDsToCounts[question.options[0].id] : 0
            return {
              project: question.prompt,
              votes: votesTally,
            }
          }),
        )

        const blob = new Blob([csvData], { type: 'text/csv' })
        saveAs(blob, `proposals-${votingRoundMetadata.title}.csv`)
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message)
        } else {
          // eslint-disable-next-line no-console
          console.error(e)
          setError('Unexpected error')
        }
      }
      setIsDownloadingProposalsCsv(false)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="col-span-1 xl:col-span-2">
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
        <div>
          <VotingStats
            isLoading={isLoadingVotingRoundData || isLoadingVotingRoundResults}
            votingRoundGlobalState={votingRoundGlobalState}
          />
        </div>
        <div>
          <VotingTime className="xl:visible" globalState={votingRoundGlobalState} loading={isLoadingVotingRoundData} />
        </div>
        <div className="col-span-1 xl:col-span-3">
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
          votingRoundMetadata?.questions.map((question) => (
            <div key={question.id}>
              {question.metadata && (
                <ProposalCard
                  title={question.prompt}
                  description={question.description}
                  category={question.metadata.category}
                  focus_area={question.metadata.focus_area}
                  link={question.metadata.link}
                  threshold={question.metadata.threshold}
                  ask={question.metadata.ask}
                  skipTags={true}
                  votesTally={
                    question.options.length > 0 && optionIDsToCounts[question.options[0].id] ? optionIDsToCounts[question.options[0].id] : 0
                  }
                  hasClosed={true}
                />
              )}
            </div>
          ))}
      </div>
      <div className="w-full text-right mt-4">
        <Button
          variant="contained"
          color="primary"
          onClick={generateProposalsResultsCsv}
          disabled={isLoadingVotingRoundData || isDownloadingProposalsCsv}
          endIcon={<FileDownloadIcon />}
        >
          Download proposals results CSV
        </Button>
      </div>
      {error && (
        <div className="w-full flex mt-4 justify-end">
          <Alert className="max-w-xl text-white bg-red font-semibold" icon={false}>
            <Typography>Could not generate csv:</Typography>
            <Typography>{error}</Typography>
          </Alert>
        </div>
      )}
    </div>
  )
}
