import { Link } from '@mui/material'
import { useEffect, useState } from 'react'
import { NFDomain, fetchNFDomain, getWalletLabel } from './wallet'

type AccountProps = {
  address: string
}

export const DisplayAddress = ({ address }: AccountProps) => {
  const [nfDomain, setNfDomain] = useState<NFDomain | undefined>(undefined)

  useEffect(() => {
    if (address) {
      fetchNFDomain(address).then((data) => {
        setNfDomain(data)
      })
    }
  }, [address])

  return (
    <>
      {nfDomain && nfDomain.name ? (
        <Link
          href={`https://app${import.meta.env.VITE_IS_TESTNET ? '.testnet' : ''}.nf.domains/name/${nfDomain.name}`}
          target="_blank"
          className="font-normal"
        >
          {nfDomain.name}
        </Link>
      ) : (
        <Link href={`${import.meta.env.VITE_ALGO_EXPLORER_URL}/address/${address}`} target="_blank" className="font-normal">
          {getWalletLabel(address)}
        </Link>
      )}
    </>
  )
}
