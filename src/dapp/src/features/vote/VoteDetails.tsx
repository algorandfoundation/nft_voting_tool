import { Link, Skeleton, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { VotingRoundPopulated } from '../../shared/types'
import { NFDomain, fetchNFDomain, getWalletLabel } from '../../shared/wallet'
import { VotingTime } from './VotingTime'

type VoteDetailsProps = {
  loading: boolean
  round: VotingRoundPopulated | undefined | null
}
export const VoteDetails = ({ loading, round }: VoteDetailsProps) => {
  const [nfDomain, setNfDomain] = useState<NFDomain | undefined>(undefined)
  const [isFetchingNfDomain, setIsFetchingNfDomain] = useState(false)

  useEffect(() => {
    if (round) {
      setIsFetchingNfDomain(true)
      fetchNFDomain(round.created.by).then((data) => {
        setNfDomain(data)
        setIsFetchingNfDomain(false)
      })
    }
  }, [round])

  return (
    <>
      {round && (
        <Stack spacing={1}>
          <Typography className="mt-5 font-bold sm:font-normal" variant="h5">
            Vote details
          </Typography>
          <VotingTime className="hidden sm:block mt-4" loading={loading} round={round} />
          {loading || isFetchingNfDomain ? (
            <Skeleton variant="text" />
          ) : (
            <Typography>
              Voting round created by{' '}
              {nfDomain && nfDomain.name ? (
                <Link
                  href={`https://app${import.meta.env.VITE_IS_TESTNET ? '.testnet' : ''}.nf.domains/name/${nfDomain.name}`}
                  target="_blank"
                  className="font-normal"
                >
                  {nfDomain.name}
                </Link>
              ) : (
                <Link
                  href={`${import.meta.env.VITE_ALGO_EXPLORER_URL}/address/${round.created.by}`}
                  target="_blank"
                  className="font-normal"
                >
                  {getWalletLabel(round.created.by)}
                </Link>
              )}
            </Typography>
          )}
          {loading ? (
            <Skeleton variant="text" />
          ) : (
            <Link href={`${import.meta.env.VITE_ALGO_EXPLORER_URL}/application/${round.id}`} target="_blank">
              Smart contract
            </Link>
          )}
          {loading ? (
            <Skeleton variant="text" />
          ) : (
            <Link href={`${import.meta.env.VITE_IPFS_GATEWAY_URL}/${round.cid}`} target="_blank">
              Voting round details in IPFS
            </Link>
          )}
          {loading ? (
            <Skeleton variant="text" />
          ) : round.snapshot?.snapshot.length ? (
            <Link href={`${import.meta.env.VITE_IPFS_GATEWAY_URL}/${round.voteGatingSnapshotCid}`} target="_blank">
              Allow list
            </Link>
          ) : null}
        </Stack>
      )}
    </>
  )
}
