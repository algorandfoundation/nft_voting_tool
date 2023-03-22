/**
 * Returns mock data for now, this should be replaced with real API calls
 */

import { useCallback, useEffect, useState } from "react";
import { atom, useRecoilValue, useSetRecoilState } from "recoil";
import { v4 as uuid } from "uuid";
import { VotingRound } from "./types";

type VotingRoundsState = {
  walletAddress: string;
  openRounds: VotingRound[];
  closedRounds: VotingRound[];
};

const votingRoundsAtom = atom<VotingRoundsState>({
  key: "votingRoundsState",
  default: {
    walletAddress: `ZS9T3...WD04E`,
    openRounds: [
      {
        id: "b34fb9cb-7e69-4ac6-a6cb-976edf1fd8d8",
        voteTitle: "Algorand Council",
        voteDescription: "This is the vote description",
        start: "2023-03-01T00:00:00.000Z",
        voteInformationUrl: "https://www.algorand.com",
        questionDescription: "Select the best candidate!",
        end: "2023-04-21T00:00:00.000Z",
        questionTitle: "Who should be on the council?",
        answers: ["Sammy", "Charlotte", "Roman", "Maxine"],
        snapshotFile: "wallet-one\nwallet-two\nwallet-three",
      },
    ],
    closedRounds: [
      {
        id: "129c3c52-1961-4e42-b88b-2a42cc5b50ca",
        voteTitle: "Another Round",
        start: "2023-02-26T00:00:00.000Z",
        end: "2023-03-06T00:00:00.000Z",
        answers: ["Yes", "No"],
        questionTitle: "Should we do this?",
        voteDescription: "This is the vote description",
        voteInformationUrl: "https://www.algorand.com",
      },
      {
        id: "4727d3e7-6cfb-4530-a4c9-980c0a3ba90f",
        voteTitle: "An earlier vote",
        start: "2023-02-18T00:00:00.000Z",
        end: "2023-02-23T00:00:00.000Z",
        answers: ["Yes", "No", "Maybe"],
        questionTitle: "Will you answer Yes, No or Maybe?",
        voteDescription: "This is the vote description",
        voteInformationUrl: "https://www.algorand.com",
      },
    ],
  },
});

const useMockGetter = <T>(payload: T) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
      setData(payload);
      // simulate loading time
    }, Math.random() * 400);
    return () => clearTimeout(timeout);
  }, []);
  return { loading, data };
};

const useMockSetter = <T>(action: (payload: T) => void, extraDelayMs = 0) => {
  const [loading, setLoading] = useState(false);
  const execute = useCallback((payload: T) => {
    setLoading(true);
    const promise = new Promise((resolve) =>
      setTimeout(() => {
        action(payload);
        setLoading(false);
        resolve(true);
        // simulate loading time
      }, Math.random() * 400 + extraDelayMs)
    );
    return promise;
  }, []);

  return { loading, execute };
};

const api = {
  useVotingRounds: () => {
    const data = useRecoilValue(votingRoundsAtom);
    return useMockGetter(data);
  },
  useVotingRound: (id: string) => {
    const data = useRecoilValue(votingRoundsAtom);
    return useMockGetter([...data.openRounds, ...data.closedRounds].find((round) => round.id === id));
  },
  useAddVotingRound: () => {
    const setState = useSetRecoilState(votingRoundsAtom);
    return useMockSetter((newRound: Omit<VotingRound, "id">) => {
      setState((state) => ({
        ...state,
        openRounds: [
          ...state.openRounds,
          {
            ...newRound,
            id: uuid(),
          },
        ],
      }));
    }, 3000);
  },
};

export default api;
