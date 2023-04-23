import { AppReference } from '@algorandfoundation/algokit-utils/types/app'
import { AppSourceMaps } from '@algorandfoundation/algokit-utils/types/application-client'
import { atom, DefaultValue, selector, useRecoilValue, useResetRecoilState, useSetRecoilState } from 'recoil'
import { QuestionModel, RoundInfo } from '../../shared/types'
import { VoteCreationReviewSteps, VoteCreationSteps } from './VoteCreationSteps'

export type VoteCreationState = {
  roundInfo: RoundInfo
  questions: QuestionModel[]
  step: VoteCreationSteps
  reviewStep: VoteCreationReviewSteps
  auth: { address: string; signedTransaction: Uint8Array }
  appReference: AppReference
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

const defaultQuestion: QuestionModel = {
  questionTitle: '',
  questionDescription: '',
  // these need to be spaces because react-hook-form acts weird if they are empty strings
  answers: [' ', ' '],
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
    questions: [defaultQuestion],
    step: VoteCreationSteps.RoundInfo,
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

const questionsSelector = selector({
  key: 'questionsSelector',
  get: ({ get }) => get(voteCreationAtom).questions,
  set: ({ set, get }, newValue) => {
    const current = get(voteCreationAtom)
    set(voteCreationAtom, { ...current, questions: newValue instanceof DefaultValue ? [defaultQuestion] : newValue })
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

export const useRoundInfo = () => useRecoilValue(roundInfoSelector)
export const useSetRoundInfo = () => useSetRecoilState(roundInfoSelector)
export const useQuestions = () => useRecoilValue<QuestionModel[]>(questionsSelector)
export const useSetQuestions = () => useSetRecoilState(questionsSelector)
export const useStep = () => useRecoilValue(stepSelector)
export const useSetStep = () => useSetRecoilState(stepSelector)
export const useReviewStep = () => useRecoilValue(reviewStepSelector)
export const useSetReviewStep = () => useSetRecoilState(reviewStepSelector)
export const useAuth = () => useRecoilValue(authSelector)
export const useSetAuth = () => useSetRecoilState(authSelector)
export const useAppReference = () => useRecoilValue(appReferenceSelector)
export const useSetAppReference = () => useSetRecoilState(appReferenceSelector)
export const useResetCreateRound = () => useResetRecoilState(voteCreationAtom)
export const useAppSourceMaps = () => useRecoilValue(appSourceMaps)
export const useSetAppSourceMaps = () => useSetRecoilState(appSourceMaps)
