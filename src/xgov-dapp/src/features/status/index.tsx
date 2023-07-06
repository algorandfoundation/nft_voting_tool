import LaunchIcon from '@mui/icons-material/Launch'
import { Alert, Box, Button, Link as MuiLink, Skeleton, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { VotingRoundGlobalState } from '../../../../dapp/src/shared/VotingRoundContract'

import { useWallet } from '@txnlab/use-wallet'
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

  const [isLoadingTermPools, setIsLoadingTermPools] = useState(true)
  const [isLoadingGovenorData, setIsLoadingGovenorData] = useState(true)
  const [isLoadingGlobalStates, setIsLoadingGlobalStates] = useState(true)

  const [error, setError] = useState<string | null>(null)

  const [termPools, setTermPools] = useState<TermPool[]>([])
  const [govenorData, setGovenorData] = useState<GovenorTermPoolData[] | null>([])
  const [isEligible, setIsEligible] = useState(false)
  const isGovenor = govenorData !== null

  useEffect(() => {
    setError(null)
    setIsLoadingTermPools(true)
    fetchTermPools()
      .then((termPools) => {
        setTermPools(termPools)
      })
      .catch((e) => {
        if (e instanceof Error) {
          setError(e.message)
        } else {
          // eslint-disable-next-line no-console
          console.error(e)
          setError('Unexpected error')
        }
      })
      .finally(() => {
        setIsLoadingTermPools(false)
      })
  }, [])

  useEffect(() => {
    if (activeAddress) {
      setError(null)
      setIsLoadingGovenorData(true)
      fetchGovenorData(activeAddress)
        .then((govenorData) => {
          setGovenorData(govenorData)
        })
        .catch((e) => {
          if (e instanceof Error) {
            setError(e.message)
          } else {
            // eslint-disable-next-line no-console
            console.error(e)
            setError('Unexpected error')
          }
        })
        .finally(() => {
          setIsLoadingGovenorData(false)
        })
    }
  }, [activeAddress])

  useEffect(() => {
    setIsEligible(false)
    if (govenorData?.length) {
      setIsEligible(govenorData[govenorData.length - 1].eligibility === 'eligible')
    }
  }, [govenorData])

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
          <div>
            <VotingSessionsTable globalStates={globalStates} termPools={termPools} isLoading={isLoadingGlobalStates} />
          </div>
          <div className="mt-4">
            <TermPoolsTable termPools={termPools} govenorData={govenorData} isLoading={isLoadingGovenorData || isLoadingTermPools} />
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
