import { Alert, Button, Link, Stack, TextField, Typography } from "@mui/material";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../shared/api";
import { useQuestions, useResetCreateRound, useRoundInfo } from "../state";
import { useStepRedirect } from "../useStepRedirect";
import { VoteCreationSteps } from "../VoteCreationSteps";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { LoadingDialog } from "./LoadingDialog";
import { Row } from "./Row";

import dayjs from "dayjs";
import { getTimezone } from "../../../shared/getTimezone";
import { getWalletAddresses } from "../../../shared/wallet";
import { Steps } from "../Steps";

export default function Review() {
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
      navigate("/", {});
    } catch (e) {
      // TODO: handle failure
    }
  };
  return (
    <>
      <Steps activeStep={VoteCreationSteps.Review} />
      <div className="max-w-3xl">
        <Typography variant="h3">{roundInfo.voteTitle}</Typography>
        <Alert className="max-w-xl bg-algorand-warning font-semibold" icon={false}>
          Review everything on this page carefully, as it cannot be changed once you create the voting round.
        </Alert>
        <Typography variant="h4" className="mt-6 mb-2">
          Vote set up
        </Typography>
        <div className="container grid grid-cols-8 gap-4">
          <Row label="Vote title" value={roundInfo.voteTitle} />
          <Row label="Vote description" value={roundInfo.voteDescription ?? "-"} />
          <Row label="Vote information" value={roundInfo.voteInformationUrl} />
          <Row label="Start date" value={dayjs(roundInfo.start).format("LLL")} />
          <Row label="End date" value={dayjs(roundInfo.end).format("LLL")} />
          <Row label="Timezone" value={getTimezone(dayjs(roundInfo.start))} />
          <Row
            label="Snapshot file"
            value={roundInfo.snapshotFile ? `${getWalletAddresses(roundInfo.snapshotFile).length.toLocaleString()} wallets` : "-"}
          />
          {roundInfo.snapshotFile && (
            <div className="col-span-6 col-start-3 max-w-xs">
              <TextField rows={6} fullWidth multiline className="max-w-md" disabled value={roundInfo.snapshotFile} />
            </div>
          )}
          <Row label="Min votes" value={roundInfo.minimumVotes?.toString() ?? "-"} />
          <div className="col-span-2">
            <Link
              onClick={(e) => {
                e.preventDefault();
                navigate(-2);
              }}
              href="#"
            >
              Edit vote information
            </Link>
          </div>
        </div>
        <Typography variant="h4" className="mt-6 mb-2">
          Question or category
        </Typography>
        <div className="container grid grid-cols-8 gap-4 ">
          <Row label="Question or category" value={questions.questionTitle} />
          <Row label="Description" value={questions.questionDescription ?? "-"} />
          <Row
            label="Options"
            value={
              <Stack spacing={1}>
                {questions.answers.map((option, index) => (
                  <Button className="w-72 uppercase" key={index} variant="outlined">
                    {option}
                  </Button>
                ))}
              </Stack>
            }
          />

          <div className="col-span-2">
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate(-1);
              }}
            >
              Edit question
            </Link>
          </div>
        </div>
        <div className="mt-8 flex gap-6 justify-end max-w-xl">
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
        <LoadingDialog
          loading={creatingVotingRound}
          title="Creating voting round..."
          note="It can take up to 30 seconds to create the voting round once you sign the transaction."
        />
      </div>
    </>
  );
}
