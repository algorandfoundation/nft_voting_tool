import { Alert, Button, Skeleton, Typography } from '@mui/material'
import { useWallet } from '@txnlab/use-wallet'
import sortBy from 'lodash.sortby'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { VotingRoundGlobalState, fetchVotingRoundGlobalStatesByCreators } from '../../../../dapp/src/shared/VotingRoundContract'
import { DisplayAddress } from '../../shared/DisplayAddress'
import { getHasVoteEnded, getHasVoteStarted } from '../../shared/vote'
import { useCreatorAddresses, useSetShowConnectWalletModal } from '../wallet/state'
import { VotingRoundSection } from './VotingRoundSection'

export const VotingRoundTileLoading = () => (
  <>
    <Skeleton className="h-32" variant="rectangular" />
    <Skeleton className="h-32" variant="rectangular" />
  </>
)

const getRounds = (
  rounds: VotingRoundGlobalState[],
  filterPredicate: (r: VotingRoundGlobalState) => boolean,
  sortPredicate: Parameters<typeof sortBy>[1],
): VotingRoundGlobalState[] => {
  const filtered = rounds.filter(filterPredicate)
  const sorted = sortBy(filtered, sortPredicate)
  return sorted
}

const VotingRounds = () => {
  const setShowConnectWalletModal = useSetShowConnectWalletModal()
  const { activeAddress } = useWallet()
  const creatorAddresses = useCreatorAddresses()
  const showMyRounds = creatorAddresses.length == 0 || creatorAddresses.includes('any')
  const isCreator = activeAddress && (creatorAddresses.includes(activeAddress) || creatorAddresses.includes('any'))

  const [globalStates, setGlobalStates] = useState<VotingRoundGlobalState[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let addressesToFetch = [] as string[]
    if (showMyRounds && activeAddress) {
      addressesToFetch = [activeAddress]
    } else if (!showMyRounds) {
      addressesToFetch = creatorAddresses
    }

    if (addressesToFetch && addressesToFetch.length) {
      ;(async () => {
        setError(null)
        setIsLoading(true)
        try {
          setGlobalStates(await fetchVotingRoundGlobalStatesByCreators(addressesToFetch))
          setIsLoading(false)
        } catch (e) {
          setIsLoading(false)
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
      setIsLoading(false)
      setGlobalStates([])
    }
  }, [activeAddress, creatorAddresses, showMyRounds])

  const walletLabel = showMyRounds ? (
    <DisplayAddress address={activeAddress} />
  ) : (
    <>
      {creatorAddresses.map((address) => (
        <DisplayAddress key={address} address={address} />
      ))}
    </>
  )

  const openRounds = globalStates
    ? getRounds(
        globalStates,
        (r) => getHasVoteStarted(r) && !getHasVoteEnded(r),
        (r: VotingRoundGlobalState) => r.end_time,
      )
    : []

  const upcomingRounds = globalStates
    ? getRounds(
        globalStates,
        (r) => !getHasVoteStarted(r) && !getHasVoteEnded(r),
        (r: VotingRoundGlobalState) => r.start_time,
      )
    : []

  const closedRounds = globalStates
    ? getRounds(
        globalStates,
        (r) => getHasVoteEnded(r),
        (r: VotingRoundGlobalState) => r.end_time,
      )
    : []

  return (
    <div className="container">
      <Typography variant="h3">Voting rounds</Typography>
      {isLoading ? (
        <Skeleton variant="text" />
      ) : !activeAddress ? (
        <div className="my-8">
          <Button variant="contained" onClick={() => setShowConnectWalletModal(true)}>
            Connect wallet
          </Button>
        </div>
      ) : (
        <>
          <Typography variant="body1">Voting rounds created by {walletLabel}</Typography>
        </>
      )}

      {isCreator && (
        <Button component={Link} to="/create" className="my-8" variant="contained">
          Create new voting round
        </Button>
      )}

      {error && (
        <Alert className="max-w-xl mt-4 text-white bg-red-600 font-semibold" icon={false}>
          <Typography>Could not load voting rounds:</Typography>
          <Typography>{error}</Typography>
        </Alert>
      )}

      <VotingRoundSection label="Open" globalStates={openRounds} loading={isLoading} />
      <VotingRoundSection label="Opening soon" globalStates={upcomingRounds} loading={isLoading} />
      <VotingRoundSection label="Closed" globalStates={closedRounds} loading={isLoading} />
    </div>
  )
}

export default VotingRounds
