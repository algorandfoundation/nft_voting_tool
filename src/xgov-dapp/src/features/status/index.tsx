import LaunchIcon from '@mui/icons-material/Launch'
import { Alert, Box, Button, Link as MuiLink, Skeleton, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import { VotingRoundGlobalState } from '../../../../dapp/src/shared/VotingRoundContract'

import { useWallet } from '@txnlab/use-wallet'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { VotingRoundMetadata, fetchVotingRoundMetadata } from '../../../../dapp/src/shared/IPFSGateway'
import { fetchVoterVotes, fetchVotingRoundGlobalStatesByCreators } from '../../../../dapp/src/shared/VotingRoundContract'
import { OpeningSoonChip, YouDidNotVoteChip, YouVotedChip } from '../../shared/Chips'
import { getHasVoteEnded, getHasVoteStarted } from '../../shared/vote'
import { GovenorTermPoolData, TermPool, fetchGovenorData, fetchTermPools } from '../../shared/xGovApi'
import { useCreatorAddresses } from '../wallet/state'
import EligibilityStatus from './EligibilityStatus'

function Status() {
  const { activeAddress } = useWallet()
  const creatorAddresses = useCreatorAddresses()
  const showMyRounds = creatorAddresses.length == 0 || creatorAddresses.includes('any')

  const [globalStates, setGlobalStates] = useState<VotingRoundGlobalState[]>([])

  const [isLoadingTermPools, setIsLoadingTermPools] = useState(true)
  const [isLoadingGovenorData, setIsLoadingGovenorData] = useState(true)
  const [isLoadingGlobalStates, setIsLoadingGlobalStates] = useState(true)

  const [error, setError] = useState<string | null>(null)

  const [termPools, setTermPools] = useState<TermPool[]>([])
  const [govenorData, setGovenorData] = useState<GovenorTermPoolData[] | null>([])
  const [isEligible, setIsEligible] = useState(false)
  const isGovenor = govenorData !== null

  useEffect(() => {
    setIsLoadingTermPools(true)
    fetchTermPools().then((termPools) => {
      setTermPools(termPools)
      setIsLoadingTermPools(false)
    })
  }, [])

  useEffect(() => {
    if (activeAddress) {
      setIsLoadingGovenorData(true)
      fetchGovenorData('TWI4TQQGI2BWT4CDCGZJCNHDYAJE5OLFBMFKXEG3OBWFOLIPGJCY6HAHKA').then((govenorData) => {
        // fetchGovenorData(activeAddress).then((govenorData) => {
        setGovenorData(govenorData)
        setIsLoadingGovenorData(false)
      })
    }
  }, [activeAddress])

  useEffect(() => {
    setIsEligible(false)
    if (govenorData && govenorData.length) {
      setIsEligible(govenorData[govenorData.length - 1].eligibility === 'eligible')
    }
  }, [govenorData])

  useEffect(() => {
    if (isGovenor) {
      setIsLoadingGlobalStates(true)
      let addressesToFetch = [] as string[]
      if (showMyRounds && activeAddress) {
        addressesToFetch = [activeAddress]
      } else if (!showMyRounds) {
        addressesToFetch = creatorAddresses
      }

      if (addressesToFetch && addressesToFetch.length) {
        ;(async () => {
          setError(null)
          setIsLoadingGlobalStates(false)
          try {
            setGlobalStates(await fetchVotingRoundGlobalStatesByCreators(addressesToFetch))
            setIsLoadingGlobalStates(false)
          } catch (e) {
            setIsLoadingGlobalStates(false)
            if (e instanceof Error) {
              setError(e.message)
            } else {
              // eslint-disable-next-line no-console
              console.error(e)
              setError('Unexpected error')
            }
          }
        })()
      } else {
        setIsLoadingGlobalStates(false)
        setGlobalStates([])
      }
    }
  }, [activeAddress, creatorAddresses, showMyRounds, isGovenor])

  if (error) {
    return (
      <Alert className="max-w-xl mt-4 text-white bg-red font-semibold" icon={false}>
        <Typography>Could not load your xGov status details:</Typography>
        <Typography>{error}</Typography>
      </Alert>
    )
  }

  if (!isGovenor) {
    return (
      <div className="text-center">
        <Typography className="mt-8 text-center" variant="h3">
          You have not signed up to be an xGov.
        </Typography>
        <Button href="" className="mt-6" variant="contained" color="primary">
          Visit xGov portal to register
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <Link to="/" className="no-underline text-gray-600 hover:underline">
          <Typography>&#60; Back to Voting sessions</Typography>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="col-span-1 sm:col-span-2">
          <Typography variant="h3">Your xGov stats</Typography>
        </div>
        <Box className="bg-white flex rounded-xl px-4 py-2 mr-4 w-fit items-center ml-auto">
          <MuiLink className="no-underline hover:underline" href="https://google.com" target="_blank">
            xGov Program Info
            <LaunchIcon className="ml-2 text-grey-light align-bottom" />
          </MuiLink>
        </Box>
        <EligibilityStatus isEligible={isEligible} isLoading={isLoadingGovenorData} />
        {isLoadingGovenorData ? (
          <Skeleton className="h-40 w-full" variant="rectangular" />
        ) : (
          <Box className="bg-white flex rounded-xl px-4 py-6">
            <div className="w-full">
              <Typography className="mb-3">
                <strong>Your xGov deposit</strong>
              </Typography>
              <Typography variant="h3">
                {govenorData.reduce((sum, item) => sum + parseInt(item.amount), 0).toLocaleString()} mALGO
              </Typography>
            </div>
          </Box>
        )}
        {isLoadingGovenorData ? (
          <Skeleton className="h-40 w-full" variant="rectangular" />
        ) : (
          <Box className="bg-white flex rounded-xl px-4 py-6">
            <div className="w-full">
              <Typography className="mb-3">
                <strong>Total earnings from xGov participation</strong>
              </Typography>
              <Typography variant="h3">TBD ALGO</Typography>
            </div>
          </Box>
        )}
        <div className="col-span-1 sm:col-span-2">
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
                {!isLoadingGlobalStates &&
                  globalStates.map((globalState) => (
                    <VoteSessionRow key={globalState.appId} globalState={globalState} termPools={termPools} />
                  ))}
              </div>
            </>
          )}

          {isLoadingGlobalStates && (
            <div>
              <Skeleton className="h-14 w-full mt-2" variant="rectangular" />
              <Skeleton className="h-14 w-full mt-2" variant="rectangular" />
              <Skeleton className="h-14 w-full mt-2" variant="rectangular" />
            </div>
          )}
          <div className="col-span-1 sm:col-span-2 mt-4">
            <div>
              <Typography variant="h4">Term Pools</Typography>
            </div>
            <div className="table w-full">
              <div className="table-row">
                <div className="table-cell pl-4">
                  <strong>Term</strong>
                </div>
                <div className="table-cell">
                  <strong>Total Pool</strong>
                </div>
                <div className="table-cell">
                  <strong>Your deposit</strong>
                </div>
                <div className="table-cell">
                  <strong>Duration</strong>
                </div>
                <div className="table-cell">
                  <strong>Earnings / Losses</strong>
                </div>
              </div>

              {!isLoadingTermPools &&
                !isLoadingGovenorData &&
                termPools &&
                termPools.length &&
                termPools.map((termPool) => {
                  const termPoolGovenorData = govenorData.find((item) => item.pool === termPool.id)
                  return (
                    <div key={termPool.id} className="table-row">
                      <div className="table-cell pb-2">
                        <div className="bg-white py-4 rounded-l-lg pl-4">{termPool.name}</div>
                      </div>
                      <div className="table-cell">
                        <div className="bg-white py-4">{parseInt(termPool.total_pool).toLocaleString()} mALGO</div>
                      </div>
                      <div className="table-cell">
                        <div className="bg-white py-4">
                          {termPoolGovenorData ? parseInt(termPoolGovenorData?.amount).toLocaleString() : 0} mALGO
                        </div>
                      </div>
                      <div className="table-cell">
                        <div className="bg-white py-4">
                          {dayjs(parseInt(termPool.start_date) * 1000).format('DD-MM-YYYY')} -{' '}
                          {dayjs(parseInt(termPool.end_date) * 1000).format('DD-MM-YYYY')}
                        </div>
                      </div>
                      <div className="table-cell">
                        <div className="bg-white py-4 rounded-r-lg">TBD</div>
                      </div>
                    </div>
                  )
                })}
            </div>
            {isLoadingTermPools ||
              (isLoadingGovenorData && (
                <div>
                  <Skeleton className="h-14 w-full mt-2" variant="rectangular" />
                  <Skeleton className="h-14 w-full mt-2" variant="rectangular" />
                  <Skeleton className="h-14 w-full mt-2" variant="rectangular" />
                </div>
              ))}
          </div>
        </div>
        <div>
          <Box className="bg-white flex rounded-xl px-4 py-6">
            <div className="w-full">
              <Typography className="mb-3">
                <strong>Voting Sessions</strong>
              </Typography>
              <Typography>
                In this version of the xGov Voting Tool, <strong>you can vote one time only</strong>. Be sure to check your vote allocation
                before submitting your vote.
              </Typography>
              <Typography className="mt-4 mb-3">
                <strong>Maintaining your xGov eligilbility</strong>
              </Typography>
              <Typography>
                <strong>Your xGov duty is to vote in all voting sessions during the 12 months of the Term Pool duration.</strong> That
                maintains your eligibility to receive the Algo deposit (your original governance rewards) back at the end of the term pool.{' '}
              </Typography>
              <Typography>
                <br />
                <strong>You will become ineligible if fail to vote on a session.</strong> If you are stacking voting power by participating
                in more than one Term Pool simultaneously, and miss a voting session, the total of Algos across all pools will be forfeited.
              </Typography>
              <Typography>
                <br />
                At the end of the Term Pool, the Algos forfeited by the ineligible xGovs will be distributed amongst all eligible xGovs.
              </Typography>
              <Typography className="mt-4 mb-4">
                <strong>Your xGov Deposit</strong>
              </Typography>
              <Typography>
                Your xGov deposit is equal to the governance rewards of the period you opted in to xGov. It is displayed in mAlgo (or
                miliAlgo) because smart contracts cannot handle decimal numbers. Your xGov deposit plus your Term Pool forfeited Algo share
                will be your payout in 12 months, if you remain eligible.
              </Typography>
            </div>
          </Box>
        </div>
      </div>
    </div>
  )
}

function VoteSessionRow({ globalState, termPools }: { globalState: VotingRoundGlobalState; termPools: TermPool[] }) {
  const { activeAddress } = useWallet()

  const [votingRoundMetadata, setVotingRoundMetadata] = useState<VotingRoundMetadata | undefined>(undefined)
  const [voterVotes, setVoterVotes] = useState<string[] | undefined>(undefined)
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(true)
  const [isLoadingVotersVote, setIsLoadingVotersVote] = useState<boolean>(true)

  const hasVoted = voterVotes !== undefined ? true : false
  const hasVoteStarted = !globalState ? false : getHasVoteStarted(globalState)
  const hasVoteEnded = !globalState ? false : getHasVoteEnded(globalState)
  const canVote = hasVoteStarted && !hasVoteEnded

  useEffect(() => {
    ;(async () => {
      setIsLoadingMetadata(true)
      try {
        setVotingRoundMetadata(await fetchVotingRoundMetadata(globalState.metadata_ipfs_cid))
        setIsLoadingMetadata(false)
      } catch (e) {
        setIsLoadingMetadata(false)
      }
    })()
  }, [globalState])

  useEffect(() => {
    refetchVotersVote(globalState.appId, activeAddress, votingRoundMetadata, globalState)
  }, [globalState, activeAddress, votingRoundMetadata])

  const refetchVotersVote = async (
    voteId: number | undefined,
    walletAddress: string | undefined,
    votingRoundMetadata: VotingRoundMetadata | undefined,
    votingRoundGlobalState: VotingRoundGlobalState | undefined,
  ) => {
    if (voteId && walletAddress && votingRoundMetadata && votingRoundGlobalState) {
      setIsLoadingVotersVote(true)
      try {
        setVoterVotes(await fetchVoterVotes(voteId, walletAddress, votingRoundMetadata, votingRoundGlobalState))
        setIsLoadingVotersVote(false)
      } catch (e) {
        setIsLoadingVotersVote(false)
        // handleError(e)
      }
    } else {
      setIsLoadingVotersVote(false)
      setVoterVotes(undefined)
    }
  }

  if (isLoadingMetadata || isLoadingVotersVote) {
    return (
      <div className="table-row">
        <div className="table-cell">
          <Skeleton className="h-14 w-full mt-2" variant="rectangular" />
        </div>
        <div className="table-cell">
          <Skeleton className="h-14 w-full mt-2" variant="rectangular" />
        </div>
        <div className="table-cell">
          <Skeleton className="h-14 w-full mt-2" variant="rectangular" />
        </div>
        <div className="table-cell">
          <Skeleton className="h-14 w-full mt-2" variant="rectangular" />
        </div>
        <div className="table-cell">
          <Skeleton className="h-14 w-full mt-2" variant="rectangular" />
        </div>
      </div>
    )
  }

  const terms: number[] = []
  termPools.forEach((termPool, index) => {
    if (checkVoteIsInTerm(globalState, termPool)) {
      terms.push(index + 1)
    }
  })

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

export default Status
