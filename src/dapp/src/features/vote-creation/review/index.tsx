import { Button, TextField, Typography } from "@mui/material";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import timezone from "dayjs/plugin/timezone";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../shared/api";
import { useQuestions, useResetCreateRound, useRoundInfo } from "../state";
import { useStepRedirect } from "../useStepRedirect";
import { VoteCreationSteps } from "../VoteCreationSteps";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { Link } from "./Link";
import { LoadingDialog } from "./LoadingDialog";
import { Row } from "./Row";
dayjs.extend(localizedFormat);
dayjs.extend(timezone);

export default function Review() {
  const utcOffset = dayjs().utcOffset() / 60;
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const toggleConfirmationDialog = () => setConfirmationDialogOpen(!confirmationDialogOpen);
  const roundInfo = useRoundInfo();
  const questions = useQuestions();
  const navigate = useNavigate();
  useStepRedirect(VoteCreationSteps.Review);
  const resetCreateState = useResetCreateRound();
  const { loading: creatingVotingRound, execute: createVotingRoundApi } = api.useAddVotingRound();
  const createVotingRound = async () => {
    try {
      await createVotingRoundApi({
        ...roundInfo,
        ...questions,
      });
      resetCreateState();
      navigate("/rounds", {});
    } catch (e) {
      // TODO: handle failure
    }
  };
  return (
    <div className="max-w-3xl">
      <Typography variant="h3">{roundInfo.voteTitle}</Typography>
      <Typography>Review everything on this page carefully, as it cannot be changed once you create the voting round.</Typography>
      <Typography variant="h4" className="mt-6 mb-2">
        Vote set up
      </Typography>
      <div className="container grid grid-cols-8 gap-4">
        <Row label="Vote title" value={roundInfo.voteTitle} />
        <Row label="Vote description" value={roundInfo.voteDescription ?? "-"} />
        <Row label="Vote information" value={roundInfo.voteInformationUrl} />
        <Row label="Start date" value={dayjs(roundInfo.start).format("LLL")} />
        <Row label="End date" value={dayjs(roundInfo.end).format("LLL")} />
        <Row label="Timezone" value={`${dayjs.tz.guess()} (UTC ${utcOffset >= 0 ? "+" : ""}${utcOffset})`} />
        <Row
          label="Snapshot file"
          value={roundInfo.snapshotFile ? `${roundInfo.snapshotFile.split("\n").length.toLocaleString()} wallets` : "-"}
        />
        {roundInfo.snapshotFile && (
          <div className="col-span-6 col-start-3 max-w-xs">
            <TextField rows={6} fullWidth multiline className="max-w-md" disabled value={roundInfo.snapshotFile} />
          </div>
        )}
        <Row label="Min votes" value={roundInfo.minimumVotes?.toString() ?? "-"} />
        <div className="col-span-2">
          <Link
            label="Edit vote set up"
            onClick={(e) => {
              e.preventDefault();
              navigate(-2);
            }}
          />
        </div>
      </div>
      <Typography variant="h4" className="mt-6 mb-2">
        Question or category
      </Typography>
      <div className="container grid grid-cols-8 gap-4 ">
        <Row label="Question or category" value={questions.questionTitle} />
        <Row label="Description" value={questions.questionDescription ?? "-"} />
        <Row label="Options" value={questions.answers[0]} />
        {questions.answers.slice(1).map((answer, index) => (
          <div key={index} className="col-span-6 col-start-3">
            <Typography className="m-0">{answer}</Typography>
          </div>
        ))}
        <div className="col-span-2">
          <Link
            label="Edit question"
            onClick={(e) => {
              e.preventDefault();
              navigate(-1);
            }}
          />
        </div>
      </div>
      <div className="mt-8 flex gap-6 justify-end max-w-md">
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button variant="contained" onClick={() => setConfirmationDialogOpen(true)}>
          Create voting round
        </Button>
      </div>
      <ConfirmationDialog
        handleOpen={toggleConfirmationDialog}
        open={confirmationDialogOpen}
        onConfirm={() => {
          toggleConfirmationDialog();
          createVotingRound();
        }}
      />
      <LoadingDialog loading={creatingVotingRound} title="Creating voting round..." />
    </div>
  );
}
