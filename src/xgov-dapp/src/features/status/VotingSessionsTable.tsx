import { Alert, Button, Skeleton, Typography } from '@mui/material'
import { useWallet } from '@txnlab/use-wallet'
import clsx from 'clsx'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { VotingRoundMetadata, fetchVotingRoundMetadata } from '../../../../dapp/src/shared/IPFSGateway'
import { VotingRoundGlobalState, fetchVoterVotes } from '../../../../dapp/src/shared/VotingRoundContract'
import { OpeningSoonChip, YouDidNotVoteChip, YouVotedChip } from '../../shared/Chips'
import { getHasVoteEnded, getHasVoteStarted } from '../../shared/vote'
import { TermPool } from '../../shared/xGovApi'

interface VotingSessionsTableProps {
  globalStates: VotingRoundGlobalState[]
  termPools: TermPool[]
  isLoading: boolean
}

function VotingSessionsTable({ globalStates, isLoading, termPools }: VotingSessionsTableProps) {
  return (
    <>
      {globalStates.length > 0 && (
        <>
          <div>
            <Typography variant="h4">Voting sessions</Typography>
          </div>
          <div className="table w-full">
            <div className="table-row">
              <div className="table-cell pl-4">
                <strong>Session</strong>
              </div>
              <div className="table-cell">
                <strong>Voting Status</strong>
              </div>
              <div className="table-cell">
                <strong>Duration</strong>
              </div>
              <div className="table-cell">
                <strong>Terms</strong>
              </div>
              <div className="table-cell">
                <strong>Actions</strong>
              </div>
            </div>
            {!isLoading &&
              globalStates.map((globalState) => (
                <VotingSessionRow key={globalState.appId} globalState={globalState} termPools={termPools} />
              ))}
          </div>
        </>
      )}

      {isLoading && (
        <div>
          <Skeleton className="h-14 w-full mt-2" variant="rectangular" />
          <Skeleton className="h-14 w-full mt-2" variant="rectangular" />
          <Skeleton className="h-14 w-full mt-2" variant="rectangular" />
        </div>
      )}
    </>
  )
}

function VotingSessionRow({ globalState, termPools }: { globalState: VotingRoundGlobalState; termPools: TermPool[] }) {
  const { activeAddress } = useWallet()

  const [votingRoundMetadata, setVotingRoundMetadata] = useState<VotingRoundMetadata | undefined>(undefined)
  const [voterVotes, setVoterVotes] = useState<string[] | undefined>(undefined)

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const hasVoted = voterVotes !== undefined ? true : false
  const hasVoteStarted = !globalState ? false : getHasVoteStarted(globalState)
  const hasVoteEnded = !globalState ? false : getHasVoteEnded(globalState)
  const canVote = hasVoteStarted && !hasVoteEnded

  useEffect(() => {
    ;(async () => {
      if (activeAddress) {
        setError(null)
        setIsLoading(true)
        try {
          const votingRoundMetadata = await fetchVotingRoundMetadata(globalState.metadata_ipfs_cid)
          setVotingRoundMetadata(votingRoundMetadata)
          setVoterVotes(await fetchVoterVotes(globalState.appId, activeAddress, votingRoundMetadata, globalState))
        } catch (e) {
          if (e instanceof Error) {
            setError(e.message)
          } else {
            // eslint-disable-next-line no-console
            console.error(e)
            setError('Unexpected error')
          }
        } finally {
          setIsLoading(false)
        }
      }
    })()
  }, [globalState, activeAddress])

  const terms: number[] = []
  termPools.forEach((termPool, index) => {
    if (checkVoteIsInTerm(globalState, termPool)) {
      terms.push(index + 1)
    }
  })

  if (error) {
    return (
      <Alert className="max-w-xl mt-4 text-white bg-red font-semibold" icon={false}>
        <Typography>Could not load voting session details:</Typography>
        <Typography>{error}</Typography>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="table-row">
        {Array.of(1, 2, 3, 4, 5).map((_, index) => {
          return (
            <div key={index} className="table-cell">
              <Skeleton className="h-14 w-full mt-2" variant="rectangular" />
            </div>
          )
        })}
      </div>
    )
  }

  if (votingRoundMetadata) {
    return (
      <div className="table-row">
        <div className="table-cell pb-2">
          <div className={clsx('py-4 rounded-l-lg pl-4', hasVoted ? 'bg-green-light' : 'bg-yellow-light')}>{votingRoundMetadata.title}</div>
        </div>
        <div className="table-cell">
          <div className={clsx('py-4', hasVoted ? 'bg-green-light' : 'bg-yellow-light')}>
            {hasVoted ? (
              <YouVotedChip isSmall={true} isWhite={true} />
            ) : hasVoteStarted ? (
              <YouDidNotVoteChip />
            ) : (
              <OpeningSoonChip isSmall={true} isWhite={true} />
            )}
          </div>
        </div>
        <div className="table-cell">
          <div className={clsx('py-4', hasVoted ? 'bg-green-light' : 'bg-yellow-light')}>
            {dayjs(globalState.start_time).format('DD-MM-YYYY')} - {dayjs(globalState.end_time).format('DD-MM-YYYY')}
          </div>
        </div>
        <div className="table-cell">
          <div className={clsx('py-4', hasVoted ? 'bg-green-light' : 'bg-yellow-light')}>
            {terms.length > 0 ? `Terms ${terms.join()}` : '-'}
          </div>
        </div>
        <div className="table-cell">
          <div
            className={clsx('rounded-r-lg', hasVoted ? 'bg-green-light' : 'bg-yellow-light', hasVoted || !canVote ? 'py-4' : 'pt-2.5 pb-2')}
          >
            {hasVoted || !canVote ? (
              <Link to={`/vote/${globalState.appId}`}>{globalState.close_time ? 'View session results' : 'View session'}</Link>
            ) : (
              <Button href={`/vote/${globalState.appId}`} variant="contained" color="primary">
                Vote now
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
}

function checkVoteIsInTerm(globalState: VotingRoundGlobalState, termPool: TermPool) {
  const startDate1 = dayjs(globalState.start_time)
  const endDate1 = dayjs(globalState.end_time)
  const startDate2 = dayjs(parseInt(termPool.start_date) * 1000)
  const endDate2 = dayjs(parseInt(termPool.end_date) * 1000)

  return startDate1.isAfter(startDate2) && endDate1.isBefore(endDate2)
}

export default VotingSessionsTable
