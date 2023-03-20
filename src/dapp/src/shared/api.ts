/**
 * Returns mock data for now, this should be replaced with real API calls
 */

import { useEffect, useState } from "react";
import { atom, useRecoilValue } from "recoil";
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
    openRounds: [],
    closedRounds: [
      // @ts-expect-error partial mock
      {
        voteTitle: "Title of voting round 2",
        start: "2023-02-26T00:00:00.000Z",
        end: "2023-03-06T00:00:00.000Z",
      },
      // @ts-expect-error partial mock
      {
        voteTitle: "Title of voting round 1",
        start: "2023-02-18T00:00:00.000Z",
        end: "2023-02-23T00:00:00.000Z",
      },
    ],
  },
});

const useMockApi = <T>(payload: T) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
      setData(payload);
    }, Math.random() * 400);
    return () => clearTimeout(timeout);
  }, []);
  return { loading, data };
};

const api = {
  useVotingRounds: () => {
    const data = useRecoilValue(votingRoundsAtom);
    return useMockApi(data);
  },
};

export default api;
