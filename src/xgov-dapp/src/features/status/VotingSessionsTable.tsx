import { useWallet } from '@makerx/use-wallet'
import { Alert, Button, Skeleton, Typography } from '@mui/material'
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
          <div className="hidden lg:block">
            <div className="table w-full border-spacing-y-2">
              <div className="table-row">
                <div className="table-cell pl-4">
                  <strong>Session</strong>
                </div>
                <div className="table-cell pl-2">
                  <strong>Voting Status</strong>
                </div>
                <div className="table-cell pl-2">
                  <strong>Duration</strong>
                </div>
                <div className="table-cell pl-2">
                  <strong>Terms</strong>
                </div>
                <div className="table-cell pl-2">
                  <strong>Actions</strong>
                </div>
              </div>
              {!isLoading &&
                globalStates.map((globalState) => (
                  <VotingSessionRow key={globalState.appId} globalState={globalState} termPools={termPools} isMobile={false} />
                ))}
            </div>
          </div>

          <div className="lg:hidden">
            {!isLoading &&
              globalStates.map((globalState) => (
                <VotingSessionRow key={globalState.appId} globalState={globalState} termPools={termPools} isMobile={true} />
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

function VotingSessionRow({
  globalState,
  termPools,
  isMobile,
}: {
  globalState: VotingRoundGlobalState
  termPools: TermPool[]
  isMobile: boolean
}) {
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

  if (isLoading && !isMobile) {
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

  if (isLoading && isMobile) {
    return <Skeleton className="h-40 w-full mb-4" variant="rectangular" />
  }

  const bgColor = hasVoted ? 'bg-green-light' : 'bg-yellow-light'

  if (votingRoundMetadata && !isMobile) {
    return (
      <div className="table-row">
        <div className={clsx('table-cell rounded-l-lg pb-2', bgColor)}>
          <div className="py-4  pl-4">{votingRoundMetadata.title}</div>
        </div>
        <div className={clsx('table-cell', bgColor)}>
          <div className="pl-2 py-4">
            {hasVoted ? (
              <YouVotedChip isSmall={true} isWhite={true} />
            ) : hasVoteStarted ? (
              <YouDidNotVoteChip />
            ) : (
              <OpeningSoonChip isSmall={true} isWhite={true} />
            )}
          </div>
        </div>
        <div className={clsx('table-cell', bgColor)}>
          <div className="pl-2 py-4">
            {dayjs(globalState.start_time).format('DD-MM-YYYY')} - {dayjs(globalState.end_time).format('DD-MM-YYYY')}
          </div>
        </div>
        <div className={clsx('table-cell', bgColor)}>
          <div className="pl-2 py-4">{terms.length > 0 ? `Terms ${terms.join()}` : '-'}</div>
        </div>
        <div className={clsx('table-cell rounded-r-lg', bgColor)}>
          <div className={clsx('rounded-r-lg', hasVoted || !canVote ? 'pl-2 py-4' : 'pl-2 pt-2.5 pb-2')}>
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
  } else if (votingRoundMetadata && isMobile) {
    return (
      <div className={`grid grid-cols-3 mb-4 rounded-lg p-4 gap-2 ${bgColor}`}>
        <div>
          <strong>Session</strong>
        </div>
        <div className="col-span-2">{votingRoundMetadata.title}</div>
        <div>
          <strong>Voting Status</strong>
        </div>
        <div className="col-span-2">
          {hasVoted ? (
            <YouVotedChip isSmall={true} isWhite={true} />
          ) : hasVoteStarted ? (
            <YouDidNotVoteChip />
          ) : (
            <OpeningSoonChip isSmall={true} isWhite={true} />
          )}
        </div>
        <div>
          <strong>Duration</strong>
        </div>
        <div className="col-span-2">
          {dayjs(globalState.start_time).format('DD-MM-YYYY')} - {dayjs(globalState.end_time).format('DD-MM-YYYY')}
        </div>
        <div>
          <strong>Terms</strong>
        </div>
        <div className="col-span-2">{terms.length > 0 ? `Terms ${terms.join()}` : '-'}</div>
        <div>
          <strong>Actions</strong>
        </div>
        <div className="col-span-2">
          {hasVoted || !canVote ? (
            <Link to={`/vote/${globalState.appId}`}>{globalState.close_time ? 'View session results' : 'View session'}</Link>
          ) : (
            <Button href={`/vote/${globalState.appId}`} variant="contained" color="primary">
              Vote now
            </Button>
          )}
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
