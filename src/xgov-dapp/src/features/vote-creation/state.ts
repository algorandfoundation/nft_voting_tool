import { AppReference } from '@algorandfoundation/algokit-utils/types/app'
import { AppSourceMaps } from '@algorandfoundation/algokit-utils/types/app-client'
import { atom, DefaultValue, selector, useRecoilValue, useResetRecoilState, useSetRecoilState } from 'recoil'
import { RoundInfo } from '../../shared/types'

export type VoteCreationState = {
  roundInfo: RoundInfo
  reviewStep: VoteCreationReviewSteps
  auth: { address: string; signedTransaction: Uint8Array }
  appReference: AppReference
}

export enum VoteCreationReviewSteps {
  Auth = 0,
  Create = 1,
  Bootstrap = 2,
  Complete = 3,
}

const defaultRoundInfo: RoundInfo = {
  end: '',
  snapshotFile: '',
  proposalFile: '',
  start: '',
  voteDescription: '',
  voteInformationUrl: '',
  voteTitle: '',
}

const defaultAuth = {
  address: '',
  signedTransaction: Uint8Array.from([]),
}

const defaultAppReference = { appId: 0, appAddress: '' }

export const voteCreationAtom = atom<VoteCreationState>({
  key: 'voteCreationState',
  default: {
    roundInfo: defaultRoundInfo,
    reviewStep: VoteCreationReviewSteps.Auth,
    auth: defaultAuth,
    appReference: defaultAppReference,
  },
})

export const appSourceMaps = atom<AppSourceMaps | undefined>({
  key: 'appSourceMapsState',
  default: undefined,
})

const roundInfoSelector = selector({
  key: 'roundInfoSelector',
  get: ({ get }) => get(voteCreationAtom).roundInfo,
  set: ({ set, get }, newValue) => {
    const current = get(voteCreationAtom)
    set(voteCreationAtom, { ...current, roundInfo: newValue instanceof DefaultValue ? defaultRoundInfo : newValue })
  },
})

const reviewStepSelector = selector({
  key: 'reviewStepSelector',
  get: ({ get }) => get(voteCreationAtom).reviewStep,
  set: ({ set, get }, newValue) => {
    const current = get(voteCreationAtom)
    set(voteCreationAtom, { ...current, reviewStep: newValue instanceof DefaultValue ? VoteCreationReviewSteps.Auth : newValue })
  },
})

const authSelector = selector({
  key: 'authSelector',
  get: ({ get }) => get(voteCreationAtom).auth,
  set: ({ set, get }, newValue) => {
    const current = get(voteCreationAtom)
    set(voteCreationAtom, { ...current, auth: newValue instanceof DefaultValue ? defaultAuth : newValue })
  },
})

const appReferenceSelector = selector({
  key: 'appReferenceSelector',
  get: ({ get }) => get(voteCreationAtom).appReference,
  set: ({ set, get }, newValue) => {
    const current = get(voteCreationAtom)
    set(voteCreationAtom, { ...current, appReference: newValue instanceof DefaultValue ? defaultAppReference : newValue })
  },
})

export const useRoundInfo = () => useRecoilValue(roundInfoSelector)
export const useSetRoundInfo = () => useSetRecoilState(roundInfoSelector)
export const useReviewStep = () => useRecoilValue(reviewStepSelector)
export const useSetReviewStep = () => useSetRecoilState(reviewStepSelector)
export const useAuth = () => useRecoilValue(authSelector)
export const useSetAuth = () => useSetRecoilState(authSelector)
export const useAppReference = () => useRecoilValue(appReferenceSelector)
export const useSetAppReference = () => useSetRecoilState(appReferenceSelector)
export const useResetCreateRound = () => useResetRecoilState(voteCreationAtom)
export const useAppSourceMaps = () => useRecoilValue(appSourceMaps)
export const useSetAppSourceMaps = () => useSetRecoilState(appSourceMaps)
