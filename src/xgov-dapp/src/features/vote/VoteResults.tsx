import FileDownloadIcon from '@mui/icons-material/FileDownload'
import { Alert, Button, Skeleton, Typography } from '@mui/material'
import { saveAs } from 'file-saver'
import Papa from 'papaparse'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Question, VoteGatingSnapshot, VotingRoundMetadata } from '../../../../dapp/src/shared/IPFSGateway'
import { VotingRoundGlobalState, fetchAddressesThatVoted } from '../../../../dapp/src/shared/VotingRoundContract'
import { ProposalCard } from '../../shared/ProposalCard'
import { VotingRoundResult } from '../../shared/types'
import {
  generateOptionIDsToCountsMapping,
  generatePassedReserveList,
  generateReserveList,
  isReserveList,
  transformToDynamicThresholds,
} from '../../utils/common'
import AlgoStats from './AlgoStats'
import { VoteDetails } from './VoteDetails'
import VotingStats from './VotingStats'
import { VotingTime } from './VotingTime'
import { dynamicThresholdSupportedVersions, reserveListSupportedVersions } from '../../constants'

export type VoteResultsProps = {
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
  const [isDownloadingAddressesCsv, setIsDownloadingAddressesCsv] = useState(false)
  const [isDownloadingProposalsCsv, setIsDownloadingProposalsCsv] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isReserveListEnabled = reserveListSupportedVersions.includes(votingRoundMetadata?.version || '1.0.0')
  const isDynamicThresholdEnabled = dynamicThresholdSupportedVersions.includes(votingRoundMetadata?.version || '1.0.0')

  const optionIDsToCounts = votingRoundResults !== undefined ? generateOptionIDsToCountsMapping(votingRoundResults) : {}

  const countVotesTally = (question: Question) => {
    return question.options.length > 0 && optionIDsToCounts[question.options[0].id] ? optionIDsToCounts[question.options[0].id] : 0
  }

  const passedToTopSort = (q1: Question, q2: Question) => {
    if (!q1.metadata?.threshold || !q2.metadata?.threshold) return 0
    return countVotesTally(q2) / q2.metadata.threshold - countVotesTally(q1) / q1.metadata.threshold
  }

  const passedToTopSortReserve = (q1: Question, q2: Question, passedReserveList: Set<string>) => {
    return passedReserveList.has(q2.id) ? 100 : passedReserveList.has(q1.id) ? -100 : passedToTopSort(q1, q2)
  }

  // clone the voting round metadata and adjust the threshold to be out of total votes instead of total voting power
  // we clone the metadata so that we don't mutate the original metadata
  const votingRoundMetadataClone = useMemo<VotingRoundMetadata | undefined>(() => {
    if (
      votingRoundMetadata === undefined ||
      snapshot === undefined ||
      votingRoundResults === undefined ||
      isLoadingVotingRoundResults === true ||
      isLoadingVotingRoundData === true
    ) {
      return undefined
    }
    if (!isDynamicThresholdEnabled) {
      return votingRoundMetadata
    }
    const totalVotes = votingRoundResults.reduce((accumulator, curr) => {
      return accumulator + curr.count
    }, 0)

    const totalVotingPower = snapshot.snapshot.reduce((accumulator, curr) => {
      return accumulator + (curr.weight || 0)
    }, 0)
    // change threshold to be out of total votes instead of total voting power
    // according to https://algorandfoundation.atlassian.net/browse/AF-73
    return transformToDynamicThresholds(votingRoundMetadata, totalVotes, totalVotingPower)
  }, [votingRoundMetadata, snapshot, isLoadingVotingRoundData, isLoadingVotingRoundResults])

  const reserveList = useMemo<Question[]>(() => {
    if (!isReserveListEnabled) {
      return []
    }
    if (votingRoundMetadataClone === undefined) {
      return []
    }
    return generateReserveList(votingRoundMetadataClone, optionIDsToCounts)
  }, [votingRoundMetadataClone])

  const passedReserveList = useMemo<Set<string>>(() => {
    if (reserveList.length === 0 || votingRoundResults === undefined || votingRoundMetadataClone === undefined) {
      return new Set()
    }
    return generatePassedReserveList(reserveList, votingRoundResults, votingRoundMetadataClone)
  }, [reserveList, votingRoundResults, votingRoundMetadataClone])

  const generateAddressesThatVotedCsv = async () => {
    if (votingRoundMetadata) {
      setIsDownloadingAddressesCsv(true)
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
      setIsDownloadingAddressesCsv(false)
    }
  }

  const generateProposalsResultsCsv = async () => {
    if (votingRoundMetadataClone) {
      setIsDownloadingProposalsCsv(true)
      setError(null)
      try {
        const csvData = Papa.unparse(
          votingRoundMetadataClone.questions.map((question) => {
            const threshold = question.metadata?.threshold
            const votesTally =
              question.options.length > 0 && optionIDsToCounts[question.options[0].id] ? optionIDsToCounts[question.options[0].id] : 0
            const percentage = threshold && threshold > 0 ? Math.min(100, (votesTally / threshold) * 100) : 100
            const hasPassed = percentage >= 100
            return {
              question: question.prompt,
              description: question.description,
              category: question.metadata?.category,
              focus_area: question.metadata?.focus_area,
              link: question.metadata?.link,
              threshold: question.metadata?.threshold,
              ask: question.metadata?.ask,
              votes: votesTally,
              is_reserve_list: isReserveListEnabled && reserveList.length > 0 && reserveList.some((q) => q.id === question.id),
              passed: hasPassed || (isReserveListEnabled && reserveList.length > 0 && passedReserveList.has(question.id)),
            }
          }),
        )

        const blob = new Blob([csvData], { type: 'text/csv' })
        saveAs(blob, `proposals-${votingRoundMetadataClone.title}.csv`)
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
            votingRoundMetadata={votingRoundMetadataClone}
            votingRoundResults={votingRoundResults}
            hasVoteClosed={true}
            passedReserveList={passedReserveList}
          />
        </div>
        <div>
          <VotingStats
            isLoading={isLoadingVotingRoundData || isLoadingVotingRoundResults}
            votingRoundGlobalState={votingRoundGlobalState}
            snapshot={snapshot}
            votingRoundResults={votingRoundResults}
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
          votingRoundMetadataClone?.questions
            .filter((q) =>
              isReserveListEnabled && q.options.length > 0 && optionIDsToCounts[q.options[0].id]
                ? !isReserveList(q, optionIDsToCounts[q.options[0].id])
                : true,
            )
            .sort((q1, q2) => passedToTopSort(q1, q2))
            .map((question) => (
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
                    votesTally={countVotesTally(question)}
                    hasClosed={true}
                  />
                )}
              </div>
            ))}
        {isReserveListEnabled && reserveList.length > 0 && (
          <>
            <div className="col-span-1 xl:col-span-3">
              <Typography variant="h4">Reserve List</Typography>
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
              reserveList
                .sort((q1, q2) => passedToTopSortReserve(q1, q2, passedReserveList))
                .map((question) => (
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
                        votesTally={countVotesTally(question)}
                        hasClosed={true}
                        forcePass={passedReserveList.has(question.id)}
                      />
                    )}
                  </div>
                ))}
          </>
        )}
      </div>
      <div className="w-full text-right mt-4">
        <Button
          variant="contained"
          color="primary"
          onClick={generateAddressesThatVotedCsv}
          disabled={isLoadingVotingRoundData || isDownloadingAddressesCsv}
          endIcon={<FileDownloadIcon />}
        >
          Download addresses that voted
        </Button>
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
