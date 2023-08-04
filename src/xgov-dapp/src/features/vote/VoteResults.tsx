import FileDownloadIcon from '@mui/icons-material/FileDownload'
import { Alert, Button, Skeleton, Typography } from '@mui/material'
import { saveAs } from 'file-saver'
import Papa from 'papaparse'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { VoteGatingSnapshot, VotingRoundMetadata } from '../../../../dapp/src/shared/IPFSGateway'
import { VotingRoundGlobalState, fetchAddressesThatVoted } from '../../../../dapp/src/shared/VotingRoundContract'
import { ProposalCard } from '../../shared/ProposalCard'
import { VotingRoundResult } from '../../shared/types'
import AlgoStats from './AlgoStats'
import { VoteDetails } from './VoteDetails'
import VotingStats from './VotingStats'
import { VotingTime } from './VotingTime'

type VoteResultsProps = {
  votingRoundResults: VotingRoundResult[] | undefined
  votingRoundMetadata: VotingRoundMetadata | undefined
  votingRoundGlobalState: VotingRoundGlobalState
  isLoadingVotingRoundData: boolean
  isLoadingVotingRoundResults: boolean
  snapshot: VoteGatingSnapshot | undefined
  myVotes?: string[]
}

export const VoteResults = ({
  votingRoundResults,
  votingRoundMetadata,
  votingRoundGlobalState,
  isLoadingVotingRoundData,
  isLoadingVotingRoundResults,
  snapshot,
}: VoteResultsProps) => {
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateAddressesThatVotedCsv = async () => {
    if (votingRoundMetadata) {
      setIsDownloadingCsv(true)
      setError(null)
      try {
        const addresses = await fetchAddressesThatVoted(votingRoundGlobalState.appId)
        const csvData = Papa.unparse(
          addresses.map((address) => {
            return { address }
          }),
        )

        const blob = new Blob([csvData], { type: 'text/csv' })
        saveAs(blob, `voters-${votingRoundMetadata.title}.csv`)
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message)
        } else {
          // eslint-disable-next-line no-console
          console.error(e)
          setError('Unexpected error')
        }
      }
      setIsDownloadingCsv(false)
    }
  }

  return (
    <div>
      <div className="mb-4">
        <Link to="/" className="no-underline text-gray-600 hover:underline">
          <Typography>&#60; Back to Voting sessions</Typography>
        </Link>
      </div>
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
          <AlgoStats
            isLoading={isLoadingVotingRoundData || isLoadingVotingRoundResults}
            votingRoundMetadata={votingRoundMetadata}
            votingRoundResults={votingRoundResults}
            hasVoteClosed={true}
          />
        </div>
        <div>
          <VotingStats
            isLoading={isLoadingVotingRoundData || isLoadingVotingRoundResults}
            votingRoundGlobalState={votingRoundGlobalState}
            snapshot={snapshot}
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
          votingRoundMetadata?.questions.map((question, index) => (
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
                  votesTally={votingRoundResults && votingRoundResults[index] ? votingRoundResults[index].count : 0}
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
          onClick={generateAddressesThatVotedCsv}
          disabled={isLoadingVotingRoundData || isDownloadingCsv}
          endIcon={<FileDownloadIcon />}
        >
          Download addresses that voted
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
