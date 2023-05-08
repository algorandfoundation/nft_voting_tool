import { Card, CardContent, Skeleton, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { VotingRoundMetadata, fetchVotingRoundMetadata } from '../../shared/IPFSGateway'
import { VotingRoundGlobalState } from '../../shared/VotingRoundContract'
import { VotingRoundStatus } from './VotingRoundStatus'

export type VotingRoundTileProps = {
  globalState: VotingRoundGlobalState
}

export const VotingRoundTile = ({ globalState }: VotingRoundTileProps) => {
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true)
  const [votingRoundMetadata, setVotingRoundMetadata] = useState<VotingRoundMetadata | undefined>(undefined)

  useEffect(() => {
    ;(async () => {
      if (globalState) {
        setIsLoadingMetadata(true)
        try {
          setVotingRoundMetadata(await fetchVotingRoundMetadata(globalState.metadata_ipfs_cid))
          setIsLoadingMetadata(false)
        } catch (e) {
          setIsLoadingMetadata(false)
        }
      } else {
        setIsLoadingMetadata(false)
        setVotingRoundMetadata(undefined)
      }
    })()
  }, [globalState])

  return (
    <Link className="no-underline" to={`/vote/${globalState.appId}`}>
      <Card className="cursor-pointer">
        <CardContent className="p-2 sm:p-6">
          <div className="text-start: sm:text-center pt-4 pb-3.5 sm:pb-12">
            <Typography variant="h5" className="font-semibold text-base sm:text-xl">
              {isLoadingMetadata ? <Skeleton className="h-7 w-full" variant="text" /> : votingRoundMetadata?.title}
            </Typography>
          </div>
          <VotingRoundStatus globalState={globalState} />
        </CardContent>
      </Card>
    </Link>
  )
}
