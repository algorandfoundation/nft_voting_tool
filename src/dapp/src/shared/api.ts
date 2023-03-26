/**
 * Returns mock data for now, this should be replaced with real API calls
 */

import * as ed from "@noble/ed25519";
import { TransactionSigner } from "algosdk";
import sortBy from "lodash.sortby";
import { useCallback, useEffect, useState } from "react";
import { atom, useRecoilValue, useSetRecoilState } from "recoil";
import * as uuid from "uuid";
import { useSetConnectedWallet } from "../features/wallet/state";
import { VotingRound } from "./types";
import { VotingRoundContract } from "./VotingRoundContract";

type AppState = {
  openRounds: VotingRound[];
  closedRounds: VotingRound[];
};

const votingRoundsAtom = atom<AppState>({
  key: "appState",
  default: {
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
        snapshotFile:
          "wallet-one\nwallet-two\nwallet-three\nPERAG7V9V3SR9ZBTO690MV6I\nALF62RMQWIAT6JO2U4M6N2XWJYM7T2XB5KFWP3K6LXH6KUG73EXFXEABAU",
        votes: [],
      },
      {
        id: "222fb9cb-7e69-4ac6-a6cb-976edf1fd8d8",
        voteTitle: "Future vote",
        voteDescription: "This is the vote description",
        start: "2024-03-01T00:00:00.000Z",
        voteInformationUrl: "https://www.algorand.com",
        questionDescription: "Select the best candidate!",
        end: "2024-04-21T00:00:00.000Z",
        questionTitle: "Who should be on the council?",
        answers: ["Sammy", "Charlotte", "Roman", "Maxine"],
        snapshotFile:
          "wallet-one\nwallet-two\nwallet-three\nPERAG7V9V3SR9ZBTO690MV6I\nALF62RMQWIAT6JO2U4M6N2XWJYM7T2XB5KFWP3K6LXH6KUG73EXFXEABAU",
        votes: [],
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
        votes: [],
        snapshotFile:
          "wallet-one\nwallet-two\nwallet-three\nPERAG7V9V3SR9ZBTO690MV6I\nALF62RMQWIAT6JO2U4M6N2XWJYM7T2XB5KFWP3K6LXH6KUG73EXFXEABAU",
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
        votes: [],
      },
    ],
  },
});

// const castVote = async (activeAddress: string, signature: string, selectedOption: string, signer: TransactionSigner, appId: number) => {
//   const algod = algokit.getAlgoClient({
//     server: import.meta.env.VITE_ALGOD_NODE_CONFIG_SERVER,
//     port: import.meta.env.VITE_ALGOD_NOTE_CONFIG_PORT,
//     token: import.meta.env.VITE_ALGOD_NODE_CONFIG_TOKEN,
//   });

//   const client = algokit.getApplicationClient(
//     {
//       app: appSpec,
//       id: appId,
//     },
//     algod
//   );

//   const signatureByArray = Buffer.from(signature, "base64");
//   const voteFee = algokit.microAlgos(1_000 + 3 /* opup - 700 x 3 to get 2000 */ * 1_000);

//   const transaction = await client.call({
//     method: "vote",
//     methodArgs: {
//       args: [signatureByArray, encodeAnswerId(selectedOption)],
//       boxes: [encodeAnswerIdBoxRef(selectedOption, await client.getAppReference())],
//     },
//     sender: {
//       addr: activeAddress,
//       signer: signer,
//     },
//     sendParams: { fee: voteFee },
//   });

//   return transaction;
// };

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

  const refetch = useCallback(
    (newPayload: T) => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setData({ ...newPayload });
        // simulate loading time
      }, Math.random() * 400);
    },
    [data, setData]
  );
  return { loading, data, refetch };
};

const useMockSetter = <T, K>(action: (payload: T) => Promise<K>, extraDelayMs = 0) => {
  const [loading, setLoading] = useState(false);
  const execute = useCallback((payload: T) => {
    setLoading(true);
    const promise = new Promise<K>((resolve) =>
      setTimeout(async () => {
        const state = await action(payload);
        setLoading(false);
        resolve(state);
        // simulate loading time
      }, Math.random() * 400 + extraDelayMs)
    );
    return promise;
  }, []);

  return { loading, execute };
};

const useSetter = <T, K>(action: (payload: T) => Promise<K>) => {
  const [loading, setLoading] = useState(false);
  const execute = useCallback((payload: T) => {
    setLoading(true);
    const promise = new Promise<K>((resolve) => {
      action(payload).then((state) => {
        resolve(state);
        setLoading(false);
      });
    });
    return promise;
  }, []);

  return { loading, execute };
};

const api = {
  useConnectWallet: () => {
    const setConnectedWallet = useSetConnectedWallet();
    return useSetter((address: string) => {
      return new Promise((resolve) => {
        setConnectedWallet(address);
        resolve(address);
      });
    });
  },
  useSubmitVote: (roundId: string) => {
    const setState = useSetRecoilState(votingRoundsAtom);
    // return useSetter(({ activeAddress, signature, selectedOption, signer }) => {
    return useSetter(
      async ({
        activeAddress,
        signature,
        selectedOption,
        signer,
        appId,
      }: {
        activeAddress: string;
        signature: string;
        selectedOption: string;
        signer: TransactionSigner;
        appId: number;
      }) => {
        const votingRoundContract = VotingRoundContract(activeAddress, signer);
        const transaction = await votingRoundContract.castVote(signature, selectedOption, appId);
        return await new Promise((resolve) => {
          setState((state) => {
            const round = state.openRounds.find((p) => p.id === roundId);
            if (!round) {
              resolve(state);
              return state;
            }
            const newState = {
              ...state,
              openRounds: [
                ...state.openRounds.filter((p_1) => p_1.id !== roundId),
                {
                  ...round,
                  votes: [
                    ...round.votes,
                    {
                      walletAddress: activeAddress,
                      selectedOption,
                    },
                  ],
                },
              ],
            };
            resolve(newState);
            return newState;
          });
        });
      }
    );
  },
  useVotingRounds: () => {
    const data = useRecoilValue(votingRoundsAtom);
    return useMockGetter({
      ...data,
      openRounds: sortBy(data.openRounds, (round) => round.start),
      closedRounds: sortBy(data.closedRounds, (round) => round.start),
    });
  },
  useVotingRound: (id: string) => {
    const data = useRecoilValue(votingRoundsAtom);
    return useMockGetter([...data.openRounds, ...data.closedRounds].find((round) => round.id === id));
  },
  useAddVotingRound: () => {
    const setState = useSetRecoilState(votingRoundsAtom);
    return useSetter(
      async ({
        newRound,
        activeAddress,
        signer,
      }: {
        newRound: Omit<VotingRound, "id" | "votes">;
        activeAddress: string;
        signer: TransactionSigner;
      }) => {
        const votingRoundContract = VotingRoundContract(activeAddress, signer);

        const privateKey = ed.utils.randomPrivateKey();
        const publicKey = await ed.getPublicKeyAsync(privateKey);
        console.log(newRound);
        const app = await votingRoundContract.create(
          publicKey,
          "cid",
          Date.parse(newRound.start),
          Date.parse(newRound.end),
          newRound.minimumVotes ? newRound.minimumVotes : 0
        );
        await votingRoundContract.bootstrap(app, newRound.answers);

        return new Promise((resolve) => {
          setState((state) => {
            const newState = {
              ...state,
              openRounds: [
                ...state.openRounds,
                {
                  ...newRound,
                  id: uuid.v4(),
                  votes: [],
                },
              ],
            };
            resolve(newState);
            return newState;
          });
        });
      }
    );
  },
};

export default api;
