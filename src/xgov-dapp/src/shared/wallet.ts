export type NFDomain = {
  address: string
  name?: string
  avatar?: string
}

export const getWalletAddresses = (snapshotFile: string | undefined) => {
  return snapshotFile?.split('\n') ?? []
}

export const getWalletLabel = (address: string) => `${address.substring(0, 6)}...${address.substring(address.length - 4)}`

export const getIsAllowedToVote = (address: string, allowList: string[]) => !allowList.length || allowList.includes(address)

export const fetchNFDomain = async (address: string): Promise<NFDomain | undefined> => {
  const nfds = await fetchNFDomains([address])
  if (nfds && nfds[0] && nfds[0].address === address) {
    return nfds[0]
  }
  return undefined
}

export const fetchNFDomains = async (addresses: string[]): Promise<NFDomain[] | undefined> => {
  const response = await fetch(
    `https://api${import.meta.env.VITE_IS_TESTNET === 'true' ? '.testnet' : ''}.nf.domains/nfd/v2/address?address=${addresses.join(
      '&address=',
    )}&view=thumbnail`,
  )
  if (!response.ok) {
    return undefined
  }

  const nfdResponse = (await response.json()) as {
    [key: string]: {
      name: string
      caAlgo: string[]
      properties?: { userDefined?: { avatar?: string }; verified?: { avatar?: string } }
    }[]
  }

  return await Promise.all(
    Object.keys(nfdResponse).map(async (address) => {
      const nfd = nfdResponse[address].find((n) => n.caAlgo.includes(address))
      if (nfd) {
        let verifiedAvatar: string | undefined = undefined
        const verifiedAvatarAsHttpUrl = nfd.properties?.verified?.avatar?.replace('ipfs://', 'https://cf-ipfs.com/ipfs/')
        // If there is a verified avatar that isn't part-way through validation (just the asset id)
        if (verifiedAvatarAsHttpUrl && verifiedAvatarAsHttpUrl.match(/^https?:\/\//)) {
          const avatarHeadResponse = await fetch(verifiedAvatarAsHttpUrl, { method: 'HEAD' })
          if (avatarHeadResponse.headers.get('content-type') === 'application/json') {
            const avatarResponse = await fetch(verifiedAvatarAsHttpUrl)
            const metadata = await avatarResponse.json()
            verifiedAvatar = metadata?.image?.replace('ipfs://', 'https://cf-ipfs.com/ipfs/')
          } else {
            verifiedAvatar = verifiedAvatarAsHttpUrl
          }
        }
        const avatar = verifiedAvatar ?? nfd.properties?.userDefined?.avatar?.replace('ipfs://', 'https://cf-ipfs.com/ipfs/')
        if (avatar?.match(/^https?:\/\//)) {
          return { address, name: nfd.name, avatar }
        }
        return { address, name: nfd.name }
      }
      return { address }
    }),
  )
}
