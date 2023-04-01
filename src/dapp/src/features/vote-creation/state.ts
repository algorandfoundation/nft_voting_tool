import { AppReference } from '@algorandfoundation/algokit-utils/types/app'
import { atom, DefaultValue, selector, useRecoilValue, useResetRecoilState, useSetRecoilState } from 'recoil'
import { Question, RoundInfo } from '../../shared/types'
import { VoteCreationReviewSteps, VoteCreationSteps } from './VoteCreationSteps'

type VoteCreationState = {
  roundInfo: RoundInfo
  questions: Question
  step: VoteCreationSteps
  reviewStep: VoteCreationReviewSteps
  auth: { address: string; signedTransaction: Uint8Array }
  appReference: {
    app: AppReference
    options: {
      id: string
      label: string
    }[]
  }
  publicKey: Uint8Array
}

const defaultRoundInfo: RoundInfo = {
  end: '',
  // @ts-expect-error setting this to an empty string forces the value to be controlled from the start
  minimumVotes: '',
  snapshotFile: '',
  start: '',
  voteDescription: '',
  voteInformationUrl: '',
  voteTitle: '',
}

const defaultQuestions: Question = {
  questionTitle: '',
  questionDescription: '',
  // these need to be spaces because react-hook-form acts weird if they are empty strings
  answers: [' ', ' '],
}

const defaultAuth = {
  address: '',
  signedTransaction: Uint8Array.from([]),
}

const defaultAppReference = { app: { appId: 0, appAddress: '' }, options: [] }

export const voteCreationAtom = atom<VoteCreationState>({
  key: 'voteCreationState',
  default: {
    roundInfo: defaultRoundInfo,
    questions: defaultQuestions,
    step: VoteCreationSteps.RoundInfo,
    reviewStep: VoteCreationReviewSteps.Auth,
    auth: defaultAuth,
    appReference: defaultAppReference,
    publicKey: Uint8Array.from([]),
  },
})

const roundInfoSelector = selector({
  key: 'roundInfoSelector',
  get: ({ get }) => get(voteCreationAtom).roundInfo,
  set: ({ set, get }, newValue) => {
    const current = get(voteCreationAtom)
    set(voteCreationAtom, { ...current, roundInfo: newValue instanceof DefaultValue ? defaultRoundInfo : newValue })
  },
})

const questionsSelector = selector({
  key: 'questionsSelector',
  get: ({ get }) => get(voteCreationAtom).questions,
  set: ({ set, get }, newValue) => {
    const current = get(voteCreationAtom)
    set(voteCreationAtom, { ...current, questions: newValue instanceof DefaultValue ? defaultQuestions : newValue })
  },
})

const stepSelector = selector({
  key: 'stepSelector',
  get: ({ get }) => get(voteCreationAtom).step,
  set: ({ set, get }, newValue) => {
    const current = get(voteCreationAtom)
    set(voteCreationAtom, { ...current, step: newValue instanceof DefaultValue ? VoteCreationSteps.RoundInfo : newValue })
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

const publicKeySelector = selector({
  key: 'publicKeySelector',
  get: ({ get }) => get(voteCreationAtom).publicKey,
  set: ({ set, get }, newValue) => {
    const current = get(voteCreationAtom)
    set(voteCreationAtom, { ...current, publicKey: newValue instanceof DefaultValue ? Uint8Array.from([]) : newValue })
  },
})

export const useRoundInfo = () => useRecoilValue(roundInfoSelector)
export const useSetRoundInfo = () => useSetRecoilState(roundInfoSelector)
export const useQuestions = () => useRecoilValue(questionsSelector)
export const useSetQuestions = () => useSetRecoilState(questionsSelector)
export const useStep = () => useRecoilValue(stepSelector)
export const useSetStep = () => useSetRecoilState(stepSelector)
export const useReviewStep = () => useRecoilValue(reviewStepSelector)
export const useSetReviewStep = () => useSetRecoilState(reviewStepSelector)
export const useAuth = () => useRecoilValue(authSelector)
export const useSetAuth = () => useSetRecoilState(authSelector)
export const usePublicKey = () => useRecoilValue(publicKeySelector)
export const useSetPublicKey = () => useSetRecoilState(publicKeySelector)
export const useAppReference = () => useRecoilValue(appReferenceSelector)
export const useSetAppReference = () => useSetRecoilState(appReferenceSelector)
export const useResetCreateRound = () => useResetRecoilState(voteCreationAtom)
