import { atom, DefaultValue, selector, useRecoilValue, useSetRecoilState } from 'recoil'

type ConnectedWallet = {
  walletAddress: string
  showConnectWalletModal: boolean
}

const connectWalletAtom = atom<ConnectedWallet>({
  key: 'connectWalletState',
  default: {
    walletAddress: '',
    showConnectWalletModal: false,
  },
})

const showConnectWalletModalSelector = selector({
  key: 'connectWalletModalState',
  get: ({ get }) => get(connectWalletAtom).showConnectWalletModal,
  set: ({ set, get }, newValue) => {
    const current = get(connectWalletAtom)
    set(connectWalletAtom, { ...current, showConnectWalletModal: newValue instanceof DefaultValue ? false : newValue })
  },
})

const walletAddressSelector = selector({
  key: 'walletAddressSelector',
  get: ({ get }) => get(connectWalletAtom).walletAddress,
  set: ({ set, get }, newValue) => {
    const current = get(connectWalletAtom)
    set(connectWalletAtom, { ...current, walletAddress: newValue instanceof DefaultValue ? '' : newValue })
  },
})

const creatorAddresses = atom<string[]>({
  key: 'creatorAddresses',
  default: import.meta.env.VITE_HACKATHON_CREATOR_ALLOW_LIST.split(','),
})

export const useShowConnectWalletModal = () => useRecoilValue(showConnectWalletModalSelector)
export const useSetShowConnectWalletModal = () => useSetRecoilState(showConnectWalletModalSelector)
export const useConnectedWallet = () => useRecoilValue(walletAddressSelector)
export const useSetConnectedWallet = () => useSetRecoilState(walletAddressSelector)
export const useCreatorAddresses = () => useRecoilValue(creatorAddresses)
