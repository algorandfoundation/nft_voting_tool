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
import AlgoStats from './AlgoStats'
import { VoteDetails } from './VoteDetails'
import VotingStats from './VotingStats'
import { VotingTime } from './VotingTime'
import { calculateTotalAskedAndAwarded } from '../../shared/stats'

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
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const oIdsToCounts = useMemo<{ [key: string]: number }>(() => {
    if (votingRoundResults === undefined) {
      return {}
    }
    return Object.fromEntries(votingRoundResults?.map((result) => [result.optionId, result.count]))
  }, [votingRoundResults])

  const passedPercentage = (q: Question) => {
    if (q.options.length === 0 || !q.metadata || !q.metadata.threshold) {
      return 0
    }
    const votesTally = oIdsToCounts[q.options[0].id] ? oIdsToCounts[q.options[0].id] : 0
    return Math.min(100, (votesTally / q.metadata.threshold) * 100)
  }

  const isReserveList = (question: Question) => {
    const percentage = passedPercentage(question)
    return percentage < 100 && percentage >= 60 // TODO: make this configurable
  }

  // clone the voting round metadata and adjust the threshold to be out of total votes instead of total voting power
  // we clone the metadata so that we don't mutate the original metadata
  const votingRoundMetadataClone = useMemo<VotingRoundMetadata | undefined>(() => {
    if (
      votingRoundMetadata === undefined ||
      snapshot === undefined ||
      isLoadingVotingRoundResults === true ||
      isLoadingVotingRoundData === true
    ) {
      return undefined
    }
    const clone = structuredClone(votingRoundMetadata) as VotingRoundMetadata
    const totalVotes = votingRoundResults?.reduce((accumulator, curr) => {
      return accumulator + curr.count
    }, 0)

    const totalVotingPower = snapshot?.snapshot.reduce((accumulator, curr) => {
      return accumulator + (curr.weight || 0)
    }, 0)
    // change threshold to be out of total votes instead of total voting power
    // according to https://algorandfoundation.atlassian.net/browse/AF-73
    clone.questions.map((question) => {
      if (question.metadata) {
        question.metadata.threshold =
          question.metadata.threshold && totalVotes && totalVotingPower && totalVotingPower !== 0
            ? (question.metadata.threshold * totalVotes) / totalVotingPower
            : question.metadata.threshold
      }
      return question
    })
    return clone
  }, [votingRoundMetadata, snapshot, isLoadingVotingRoundData, isLoadingVotingRoundResults])

  const reserveList = useMemo<Question[]>(() => {
    if (votingRoundMetadataClone === undefined) {
      return []
    }
    // sort reserve list by success rate, descending
    return votingRoundMetadataClone.questions.filter(isReserveList).sort((a, b) => {
      const percentageA = passedPercentage(a)
      const percentageB = passedPercentage(b)
      return percentageB - percentageA
    })
  }, [votingRoundMetadataClone])

  const passedReserveList = useMemo<Set<string>>(() => {
    if (
      reserveList.length === 0 ||
      votingRoundResults === undefined ||
      votingRoundMetadataClone === undefined ||
      votingRoundMetadataClone.communityGrantAllocation === undefined
    ) {
      return new Set()
    }
    const passedReserveList: Set<string> = new Set()
    const { totalAwarded } = calculateTotalAskedAndAwarded(votingRoundResults, votingRoundMetadataClone)
    let awardsForReserveList = votingRoundMetadataClone.communityGrantAllocation - totalAwarded.algos().microAlgos
    for (const question of reserveList) {
      if (question.metadata && question.metadata.ask && awardsForReserveList >= question.metadata.ask.algos().microAlgos) {
        passedReserveList.add(question.id)
        awardsForReserveList -= question.metadata.ask.algos().microAlgos
      }
    }
    return passedReserveList
  }, [reserveList, votingRoundResults, votingRoundMetadataClone])

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
            .filter((q) => !isReserveList(q))
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
                    votesTally={
                      question.options.length > 0 && oIdsToCounts[question.options[0].id] ? oIdsToCounts[question.options[0].id] : 0
                    }
                    hasClosed={true}
                  />
                )}
              </div>
            ))}
        {reserveList.length > 0 && (
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
              reserveList.map((question) => (
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
                      votesTally={
                        question.options.length > 0 && oIdsToCounts[question.options[0].id] ? oIdsToCounts[question.options[0].id] : 0
                      }
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
