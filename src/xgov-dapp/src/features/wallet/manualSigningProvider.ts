import { Buffer } from 'buffer'
import { CustomProvider, Metadata, PROVIDER_ID } from '@makerx/use-wallet'
import type _algosdk from 'algosdk'
import { DefaultValue, SetterOrUpdater, atom, selector, useRecoilValue, useSetRecoilState } from 'recoil'

type ManualWallet = {
  payloadToSign: string
  showManualWalletModal: boolean
}

const manualWalletAtom = atom<ManualWallet>({
  key: 'manualWalletState',
  default: {
    payloadToSign: '',
    showManualWalletModal: false,
  },
})

const showManualWalletModalSelector = selector({
  key: 'showManualWalletModalSelector',
  get: ({ get }) => get(manualWalletAtom).showManualWalletModal,
  set: ({ set, get }, newValue) => {
    set(manualWalletAtom, {
      showManualWalletModal: newValue instanceof DefaultValue ? false : newValue,
      payloadToSign: '',
    })
  },
})

const manualWalletPayloadToSignSelector = selector({
  key: 'manualWalletPayloadToSignSelector',
  get: ({ get }) => get(manualWalletAtom).payloadToSign,
  set: ({ set, get }, newValue) => {
    const current = get(manualWalletAtom)
    set(manualWalletAtom, { ...current, payloadToSign: newValue instanceof DefaultValue ? '' : newValue })
  },
})

export const useManualWalletModal = () => useRecoilValue(manualWalletAtom)
export const useSetShowManualWalletModal = () => useSetRecoilState(showManualWalletModalSelector)
export const useSetManualWalletPayloadToSign = () => useSetRecoilState(manualWalletPayloadToSignSelector)

export class ManualSigningProvider implements CustomProvider {
  algosdk: typeof _algosdk
  showManualWallet: SetterOrUpdater<boolean>
  setPayloadToSign: SetterOrUpdater<string>
  submittedValue: string | null | undefined = undefined

  constructor(algosdkStatic: typeof _algosdk, showManualWallet: SetterOrUpdater<boolean>, setPayloadToSign: SetterOrUpdater<string>) {
    this.algosdk = algosdkStatic
    this.showManualWallet = showManualWallet
    this.setPayloadToSign = setPayloadToSign
  }

  clear() {
    this.submittedValue = undefined
  }

  submitted(value: string) {
    this.submittedValue = value
  }

  cancelled() {
    this.submittedValue = null
  }

  async connect(metadata: Metadata) {
    let address = prompt('Enter address of your account')
    if (address && !this.algosdk.isValidAddress(address)) {
      alert('Invalid address; please try again')
      address = null
    }
    const authAddress = address ? prompt("Enter address of the signing account; leave blank if account hasn't been rekeyed") : undefined

    return {
      ...metadata,
      accounts: address
        ? [
            {
              address,
              name: address,
              providerId: PROVIDER_ID.CUSTOM,
              authAddr: authAddress === null || authAddress === address ? undefined : authAddress,
            },
          ]
        : [],
    }
  }

  async disconnect() {
    //
  }

  async reconnect(_metadata: Metadata) {
    return null
  }

  async signTransactions(
    connectedAccounts: string[],
    txnGroups: Uint8Array[] | Uint8Array[][],
    indexesToSign?: number[] | undefined,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _returnGroup?: boolean | undefined,
  ): Promise<Uint8Array[]> {
    // If txnGroups is a nested array, flatten it
    const transactions: Uint8Array[] = Array.isArray(txnGroups[0])
      ? (txnGroups as Uint8Array[][]).flatMap((txn) => txn)
      : (txnGroups as Uint8Array[])

    // Decode the transactions to access their properties.
    const decodedTxns = transactions.map((txn) => {
      return this.algosdk.decodeObj(txn)
    }) as Array<_algosdk.EncodedTransaction | _algosdk.EncodedSignedTransaction>

    const signedTxns: Array<Uint8Array> = []

    let idx = -1
    for (const dtxn of decodedTxns) {
      idx++
      const isSigned = 'txn' in dtxn

      // push the incoming txn into signed, we'll overwrite it later
      signedTxns.push(transactions[idx])

      // Its already signed, skip it
      if (isSigned) {
        continue
        // Not specified in indexes to sign, skip it
      } else if (indexesToSign && indexesToSign.length && !indexesToSign.includes(Number(idx))) {
        continue
      }
      // Not to be signed by our signer, skip it
      else if (!connectedAccounts.includes(this.algosdk.encodeAddress(dtxn.snd))) {
        continue
      }

      const unsignedTxn = this.algosdk.decodeUnsignedTransaction(transactions[idx])

      const forSigning = Buffer.from(
        this.algosdk.encodeObj({
          txn: unsignedTxn.get_obj_for_encoding(),
        }),
      ).toString('base64')

      this.clear()
      this.showManualWallet(true)
      this.setPayloadToSign(forSigning)
      const signed = await new Promise<string | null>((resolve) => {
        ;(async () => {
          while (this.submittedValue === undefined) {
            await new Promise((sleepResolve) => setTimeout(sleepResolve, 100))
          }
          resolve(this.submittedValue)
        })()
      })

      if (signed === null) {
        throw new Error("Didn't receive signed transaction")
      }
      const encoded = Buffer.from(signed, 'base64')
      signedTxns[idx] = encoded
    }

    return signedTxns
  }
}
