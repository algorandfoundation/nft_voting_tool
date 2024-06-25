import LaunchIcon from '@mui/icons-material/Launch'
import { Alert, Box, Button, Link as MuiLink, Skeleton, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { VotingRoundGlobalState } from '../../../../dapp/src/shared/VotingRoundContract'

import { useWallet } from '@makerx/use-wallet'
import { useEffect, useState } from 'react'
import { fetchVotingRoundGlobalStatesByCreators } from '../../../../dapp/src/shared/VotingRoundContract'
import { GovenorTermPoolData, TermPool, fetchGovenorData, fetchTermPools } from '../../shared/xGovApi'
import { useCreatorAddresses, useSetShowConnectWalletModal } from '../wallet/state'
import EligibilityStatus from './EligibilityStatus'
import InformationBox from './InformationBox'
import TermPoolsTable from './TermPoolsTable'
import VotingSessionsTable from './VotingSessionsTable'

function Status() {
  const { activeAddress } = useWallet()
  const creatorAddresses = useCreatorAddresses()
  const showMyRounds = creatorAddresses.length == 0 || creatorAddresses.includes('any')
  const setShowConnectedWalletModal = useSetShowConnectWalletModal()
  const showConnectWalletModal = () => setShowConnectedWalletModal(true)

  const [globalStates, setGlobalStates] = useState<VotingRoundGlobalState[]>([])

  const [isLoadingXgovData, setIsLoadingXgovData] = useState(true)
  const [isLoadingGlobalStates, setIsLoadingGlobalStates] = useState(true)

  const [error, setError] = useState<string | null>(null)

  const [termPools, setTermPools] = useState<TermPool[]>([])
  const [govenorData, setGovenorData] = useState<GovenorTermPoolData[] | null>([])
  const [isEligible, setIsEligible] = useState(false)
  const isGovenor = govenorData !== null

  useEffect(() => {
    if (activeAddress) {
      ;(async () => {
        setError(null)
        setIsLoadingXgovData(true)
        setIsEligible(false)

        try {
          //TWI4TQQGI2BWT4CDCGZJCNHDYAJE5OLFBMFKXEG3OBWFOLIPGJCY6HAHKA
          const [termPools, govenorData] = await Promise.all([fetchTermPools(), fetchGovenorData(activeAddress)])
          setTermPools(termPools)
          setGovenorData(govenorData)
          if (govenorData?.length) {
            setIsEligible(govenorData[govenorData.length - 1].eligibility === 'eligible')
          }
        } catch (e) {
          if (e instanceof Error) {
            setError(e.message)
          } else {
            // eslint-disable-next-line no-console
            console.error(e)
            setError('Unexpected error')
          }
        } finally {
          setIsLoadingXgovData(false)
        }
      })()
    }
  }, [activeAddress])

  useEffect(() => {
    if (isGovenor) {
      setIsLoadingGlobalStates(true)
      let addressesToFetch: string[] = []
      if (showMyRounds && activeAddress) {
        addressesToFetch = [activeAddress]
      } else if (!showMyRounds) {
        addressesToFetch = creatorAddresses
      }

      if (addressesToFetch?.length) {
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

  if (!activeAddress) {
    return (
      <div className="text-center">
        <Typography className="mt-8 text-center" variant="h3">
          In order to check your xGov status you need to connect your wallet.
        </Typography>
        <Button onClick={showConnectWalletModal} variant="contained">
          Connect wallet
        </Button>
      </div>
    )
  }

  if (!isGovenor) {
    return (
      <div className="text-center">
        <Typography className="mt-8 text-center" variant="h3">
          You have not signed up or are no longer eligible to be an xGov.
        </Typography>
        <Button href="https://algorand.foundation/xgov" target="_blank" className="mt-6" variant="contained" color="primary">
          Find out more about xGov
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-1 lg:col-span-2">
          <Typography variant="h3">Your xGov stats</Typography>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Box className="bg-white flex rounded-xl px-4 py-2 items-center">
            <MuiLink className="no-underline hover:underline" href="https://forum.algorand.org/t/xgov-guide-post-alpha-pilot/12153" target="_blank">
              xGov Guide
              <LaunchIcon className="ml-2 text-grey-light align-bottom" />
            </MuiLink>
          </Box>
        </div>
        <EligibilityStatus isEligible={isEligible} isLoading={isLoadingXgovData} />
        {isLoadingXgovData ? (
          <Skeleton className="h-40 w-full" variant="rectangular" />
        ) : (
          <Box className="bg-white flex rounded-xl px-4 py-6">
            <div className="w-full">
              <Typography className="mb-3">
                <strong>Your xGov Current Balance</strong>
              </Typography>
              <Typography variant="h3">
                {govenorData.reduce((sum, item) => sum + parseInt(item.current_reward), 0).toLocaleString()} µA
              </Typography>
            </div>
          </Box>
        )}
        {isLoadingXgovData ? (
          <Skeleton className="h-40 w-full" variant="rectangular" />
        ) : (
          <Box className="bg-white flex rounded-xl px-4 py-6">
            <div className="w-full">
              <Typography className="mb-3">
                <strong>Potential earnings from xGov participation</strong>
              </Typography>
              <Typography variant="h3">
                {govenorData
                  .reduce(
                    (prev, current) =>
                      prev +
                      (current?.current_reward
                        ? Math.floor(Number(current?.current_reward) - parseInt(current?.original_reward)) / 1_000_000
                        : 0),
                    0,
                  )
                  .toLocaleString()}{' '}
                ALGO
              </Typography>
            </div>
          </Box>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="col-span-1 lg:col-span-2">
          <div>
            <VotingSessionsTable
              globalStates={globalStates}
              termPools={termPools}
              isLoading={isLoadingGlobalStates}
              isEligible={isEligible}
            />
          </div>
          <div className="mt-4">
            <TermPoolsTable termPools={termPools} govenorData={govenorData} isLoading={isLoadingXgovData} />
          </div>
        </div>
        <div>
          <InformationBox />
        </div>
      </div>
    </div>
  )
}

export default Status
