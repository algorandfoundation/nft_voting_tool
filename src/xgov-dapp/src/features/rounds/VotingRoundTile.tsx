import { useWallet } from '@makerx/use-wallet'
import { Box, Button, Skeleton, Typography } from '@mui/material'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  VoteGatingSnapshot,
  VotingRoundMetadata,
  fetchVotingRoundMetadata,
  fetchVotingSnapshot,
} from '../../../../dapp/src/shared/IPFSGateway'
import { TallyCounts, VotingRoundGlobalState, fetchTallyCounts, fetchVoterVotes } from '../../../../dapp/src/shared/VotingRoundContract'
import { ClosedChip, OpenChip, OpeningSoonChip, YouHaveNotVotedChip, YouVotedChip } from '../../shared/Chips'
import { calculateTotalAskedAndAwarded } from '../../shared/stats'
import AlgoStats from '../vote/AlgoStats'
import VotingStats from '../vote/VotingStats'
import { VotingTime } from '../vote/VotingTime'
dayjs.extend(relativeTime)

export type VotingRoundTileProps = {
  globalState: VotingRoundGlobalState
  votingRoundStatus: VotingRoundStatus
}

export enum VotingRoundStatus {
  OPEN = 1,
  OPENING_SOON = 2,
  CLOSED = 3,
}

export const VotingRoundTile = ({ globalState, votingRoundStatus }: VotingRoundTileProps) => {
  const { activeAddress } = useWallet()

  const [votingRoundMetadata, setVotingRoundMetadata] = useState<VotingRoundMetadata | undefined>(undefined)
  const [voterVotes, setVoterVotes] = useState<string[] | undefined>(undefined)
  const [votingRoundResults, setVotingRoundResults] = useState<TallyCounts | undefined>(undefined)
  const [snapshot, setSnapshot] = useState<VoteGatingSnapshot | undefined>(undefined)

  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true)
  const [isLoadingVotingRoundResults, setIsLoadingVotingRoundResults] = useState(true)
  const [isLoadingVotersVote, setIsLoadingVotersVote] = useState(true)
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(true)

  const hasVoted = voterVotes !== undefined ? true : false

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

  useEffect(() => {
    refetchVotersVote(globalState.appId, activeAddress, votingRoundMetadata, globalState)
  }, [globalState, activeAddress, votingRoundMetadata])

  useEffect(() => {
    refetchVoteResults(globalState.appId, votingRoundMetadata)
  }, [globalState, votingRoundMetadata])

  useEffect(() => {
    ;(async () => {
      if (votingRoundMetadata) {
        if (votingRoundMetadata.voteGatingSnapshotCid) {
          setIsLoadingSnapshot(true)
          const snapshot = await fetchVotingSnapshot(votingRoundMetadata.voteGatingSnapshotCid)
          setSnapshot(snapshot)
          setIsLoadingSnapshot(false)
        }
      }
    })()
  }, [votingRoundMetadata])

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

  const refetchVoteResults = async (voteId: number | undefined, votingRoundMetadata: VotingRoundMetadata | undefined) => {
    if (voteId && votingRoundMetadata) {
      setIsLoadingVotingRoundResults(true)
      try {
        setVotingRoundResults(await fetchTallyCounts(voteId, votingRoundMetadata))
        setIsLoadingVotingRoundResults(false)
      } catch (e) {
        setIsLoadingVotingRoundResults(false)
        // handleError(e)
      }
    } else {
      setIsLoadingVotingRoundResults(false)
      setVotingRoundResults(undefined)
    }
  }

  if (votingRoundStatus === VotingRoundStatus.OPEN || votingRoundStatus === VotingRoundStatus.OPENING_SOON) {
    return (
      <Box className="bg-white rounded-lg p-5">
        <div className="mb-2 justify-between flex">
          <div>
            {votingRoundStatus === VotingRoundStatus.OPEN ? (
              <>
                <OpenChip />
                {activeAddress && !isLoadingVotersVote && (hasVoted ? <YouVotedChip /> : <YouHaveNotVotedChip />)}
              </>
            ) : (
              <OpeningSoonChip />
            )}
          </div>
          <div>
            {votingRoundStatus === VotingRoundStatus.OPEN && (
              <Button component={Link} to={`/vote/${globalState.appId}`} variant="contained" color="primary">
                View Proposals
              </Button>
            )}
          </div>
        </div>
        {isLoadingMetadata ? (
          <Skeleton className="h-10 w-full" variant="text" />
        ) : (
          <Typography variant="h4">{votingRoundMetadata?.title}</Typography>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div>
            <AlgoStats
              isLoading={isLoadingMetadata || isLoadingVotingRoundResults}
              votingRoundMetadata={votingRoundMetadata}
              votingRoundResults={votingRoundResults}
              hasVoteClosed={false}
            />
          </div>
          <div>
            <VotingStats isLoading={isLoadingSnapshot} votingRoundGlobalState={globalState} snapshot={snapshot} />
          </div>
          <div>
            <VotingTime globalState={globalState} loading={false} className="lg:visible" />
          </div>
        </div>
      </Box>
    )
  }

  const { totalAsked, totalAwarded } = calculateTotalAskedAndAwarded(votingRoundResults, votingRoundMetadata)

  return (
    <Box className="bg-white rounded-lg p-5">
      <div className="mb-3 justify-between flex">
        <div>
          <ClosedChip />
          {activeAddress && !isLoadingVotersVote && (hasVoted ? <YouVotedChip isSmall={true} /> : <YouHaveNotVotedChip isSmall={true} />)}
        </div>
        <div>
          <Link to={`/vote/${globalState.appId}`}>View Results</Link>
        </div>
      </div>
      <div className="">
        {isLoadingMetadata ? (
          <Skeleton className="h-12 w-full" variant="text" />
        ) : (
          <Typography variant="h5" className="mb-5">
            {votingRoundMetadata?.title}
          </Typography>
        )}
      </div>
      <Typography className="mb-4">
        {(isLoadingVotingRoundResults || isLoadingMetadata) && <Skeleton className="h-6 w-full" variant="text" />}
        {!isLoadingVotingRoundResults && !isLoadingMetadata && `${totalAwarded} of ${totalAsked} ALGO allocated`}
      </Typography>
      <Typography className="mb-4">
        {isLoadingSnapshot && <Skeleton className="h-6 w-full" variant="text" />}
        {!isLoadingSnapshot && snapshot && `${globalState.voter_count} out of ${snapshot.snapshot.length} wallets voted`}
      </Typography>
      <Typography>
        Closed {globalState.close_time ? dayjs(globalState?.close_time).fromNow() : dayjs(globalState?.end_time).fromNow()}
      </Typography>
    </Box>
  )
}
