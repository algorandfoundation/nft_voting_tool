import { atom, DefaultValue, selector, useRecoilValue, useSetRecoilState } from "recoil";
import { Fields as QuestionFields } from "./Questions";
import { Fields as RoundInfoFields } from "./RoundInfo";
import { VoteCreationSteps } from "./VoteCreationSteps";

type VoteCreationState = {
  roundInfo: RoundInfoFields;
  questions: QuestionFields;
  step: VoteCreationSteps;
};

const defaultRoundInfo: RoundInfoFields = {
  end: "",
  // @ts-expect-error setting this to an empty string forces the value to be controlled from the start
  minimumVotes: "",
  snapshotFile: "",
  start: "",
  voteDescription: "",
  voteInformationUrl: "",
  voteTitle: "",
};

const defaultQuestions: QuestionFields = {
  questionTitle: "",
  questionDescription: "",
  // these need to be spaces because react-hook-form acts weird if they are empty strings
  answers: [" ", " "],
};

const voteCreationAtom = atom<VoteCreationState>({
  key: "voteCreationState",
  default: {
    roundInfo: defaultRoundInfo,
    questions: defaultQuestions,
    step: VoteCreationSteps.RoundInfo,
  },
});

const roundInfoSelector = selector({
  key: "roundInfoSelector",
  get: ({ get }) => get(voteCreationAtom).roundInfo,
  set: ({ set, get }, newValue) => {
    const current = get(voteCreationAtom);
    set(voteCreationAtom, { ...current, roundInfo: newValue instanceof DefaultValue ? defaultRoundInfo : newValue });
  },
});

const questionsSelector = selector({
  key: "questionsSelector",
  get: ({ get }) => get(voteCreationAtom).questions,
  set: ({ set, get }, newValue) => {
    const current = get(voteCreationAtom);
    set(voteCreationAtom, { ...current, questions: newValue instanceof DefaultValue ? defaultQuestions : newValue });
  },
});

const stepSelector = selector({
  key: "stepSelector",
  get: ({ get }) => get(voteCreationAtom).step,
  set: ({ set, get }, newValue) => {
    const current = get(voteCreationAtom);
    set(voteCreationAtom, { ...current, step: newValue instanceof DefaultValue ? VoteCreationSteps.RoundInfo : newValue });
  },
});

export const useRoundInfo = () => useRecoilValue(roundInfoSelector);
export const useSetRoundInfo = () => useSetRecoilState(roundInfoSelector);
export const useQuestions = () => useRecoilValue(questionsSelector);
export const useSetQuestions = () => useSetRecoilState(questionsSelector);
export const useStep = () => useRecoilValue(stepSelector);
export const useSetStep = () => useSetRecoilState(stepSelector);
