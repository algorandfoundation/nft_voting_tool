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
import { VotingRoundStatus } from './types'
dayjs.extend(relativeTime)

export type VotingRoundWrapperProps = {
  state: VotingRoundGlobalState
  status: VotingRoundStatus
}

export type VotingRoundTileProps = {
  state: VotingRoundGlobalState
  status: VotingRoundStatus
  activeAddress: string | undefined
  metadata: {
    data: VotingRoundMetadata | undefined
    isLoading: boolean
  }
  snapshot: {
    data: VoteGatingSnapshot | undefined
    isLoading: boolean
  }
  result: {
    data: TallyCounts | undefined
    isLoading: boolean
  }
  voterVotes: {
    data: string[] | undefined
    isLoading: boolean
  }
}
export const VotingRoundTile = ({ state, status, activeAddress, metadata, snapshot, result, voterVotes }: VotingRoundTileProps) => {
  const hasVoted = voterVotes.data !== undefined
  if (status === VotingRoundStatus.OPEN || status === VotingRoundStatus.OPENING_SOON) {
    return (
      <Box className="bg-white rounded-lg p-5">
        <div className="mb-2 justify-between flex">
          <div>
            {status === VotingRoundStatus.OPEN ? (
              <>
                <OpenChip />
                {activeAddress && !result.isLoading && (hasVoted ? <YouVotedChip /> : <YouHaveNotVotedChip />)}
              </>
            ) : (
              <OpeningSoonChip />
            )}
          </div>
          <div>
            {status === VotingRoundStatus.OPEN && (
              <Button component={Link} to={`/vote/${state.appId}`} variant="contained" color="primary">
                View Proposals
              </Button>
            )}
          </div>
        </div>
        {metadata.isLoading ? (
          <Skeleton className="h-10 w-full" variant="text" />
        ) : (
          <Typography variant="h4">{metadata.data?.title}</Typography>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div>
            <AlgoStats
              isLoading={metadata.isLoading || result.isLoading}
              votingRoundMetadata={metadata.data}
              votingRoundResults={result.data}
              hasVoteClosed={false}
            />
          </div>
          <div>
            <VotingStats isLoading={snapshot.isLoading} votingRoundGlobalState={state} snapshot={snapshot.data} />
          </div>
          <div>
            <VotingTime globalState={state} loading={false} className="lg:visible" />
          </div>
        </div>
      </Box>
    )
  }

  const { totalAsked, totalAwarded } = calculateTotalAskedAndAwarded(result.data, metadata.data)

  return (
    <Box className="bg-white rounded-lg p-5">
      <div className="mb-3 justify-between flex">
        <div>
          <ClosedChip />
          {activeAddress && !voterVotes.isLoading && (hasVoted ? <YouVotedChip isSmall={true} /> : <YouHaveNotVotedChip isSmall={true} />)}
        </div>
        <div>
          <Link to={`/vote/${state.appId}`}>View Results</Link>
        </div>
      </div>
      <div className="">
        {metadata.isLoading ? (
          <Skeleton className="h-12 w-full" variant="text" />
        ) : (
          <Typography variant="h5" className="mb-5">
            {metadata.data?.title}
          </Typography>
        )}
      </div>
      <Typography className="mb-4">
        {(result.isLoading || metadata.isLoading) && <Skeleton className="h-6 w-full" variant="text" />}
        {!result.isLoading && !metadata.isLoading && `${totalAwarded} of ${totalAsked} ALGO allocated`}
      </Typography>
      <Typography className="mb-4">
        {snapshot.isLoading && <Skeleton className="h-6 w-full" variant="text" />}
        {!snapshot.isLoading && snapshot.data && `${state.voter_count} out of ${snapshot.data.snapshot.length} wallets voted`}
      </Typography>
      <Typography>Closed {state.close_time ? dayjs(state?.close_time).fromNow() : dayjs(state?.end_time).fromNow()}</Typography>
    </Box>
  )
}

export default function VotingRoundTileWrapper({ state, status }: VotingRoundWrapperProps) {
  const { activeAddress } = useWallet()

  const [votingRoundMetadata, setVotingRoundMetadata] = useState<VotingRoundMetadata | undefined>(undefined)
  const [voterVotes, setVoterVotes] = useState<string[] | undefined>(undefined)
  const [votingRoundResults, setVotingRoundResults] = useState<TallyCounts | undefined>(undefined)
  const [snapshot, setSnapshot] = useState<VoteGatingSnapshot | undefined>(undefined)

  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true)
  const [isLoadingVotingRoundResults, setIsLoadingVotingRoundResults] = useState(true)
  const [isLoadingVotersVote, setIsLoadingVotersVote] = useState(true)
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(true)

  useEffect(() => {
    ;(async () => {
      if (state) {
        setIsLoadingMetadata(true)
        try {
          setVotingRoundMetadata(await fetchVotingRoundMetadata(state.metadata_ipfs_cid))
          setIsLoadingMetadata(false)
        } catch (e) {
          setIsLoadingMetadata(false)
        }
      } else {
        setIsLoadingMetadata(false)
        setVotingRoundMetadata(undefined)
      }
    })()
  }, [state])

  useEffect(() => {
    refetchVotersVote(state.appId, activeAddress, votingRoundMetadata, state)
  }, [state, activeAddress, votingRoundMetadata])

  useEffect(() => {
    refetchVoteResults(state.appId, votingRoundMetadata)
  }, [state, votingRoundMetadata])

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

  return (
    <VotingRoundTile
      state={state}
      status={status}
      activeAddress={activeAddress}
      metadata={{
        data: votingRoundMetadata,
        isLoading: isLoadingMetadata,
      }}
      snapshot={{
        data: snapshot,
        isLoading: isLoadingSnapshot,
      }}
      result={{
        data: votingRoundResults,
        isLoading: isLoadingVotingRoundResults,
      }}
      voterVotes={{
        data: voterVotes,
        isLoading: isLoadingVotersVote,
      }}
    />
  )
}
