export type RoundInfo = {
  end: string;
  minimumVotes: number;
  snapshotFile?: string;
  start: string;
  voteDescription: string;
  voteInformationUrl: string;
  voteTitle: string;
};

export type Question = {
  questionTitle: string;
  questionDescription?: string;
  answers: string[];
};

export type VotingRound = RoundInfo & Question;
