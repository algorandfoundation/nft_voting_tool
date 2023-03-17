import { Button, Textarea, Typography } from "@material-tailwind/react";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import timezone from "dayjs/plugin/timezone";
import { useState } from "react";
import { QuestionFormProps } from "../QuestionForm";
import { RoundInfoFormProps } from "../RoundInfoForm";
import { VoteCreationSteps } from "../VoteCreationSteps";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { Link } from "./Link";
import { Row } from "./Row";
dayjs.extend(localizedFormat);
dayjs.extend(timezone);

export interface ReviewProps {
  onCreate: () => void;
  question: QuestionFormProps["defaultValues"];
  roundInfo: RoundInfoFormProps["defaultValues"];
  back: () => void;
  setCurrentStep: (step: VoteCreationSteps) => void;
}

export default function Review({ onCreate, roundInfo, question, back, setCurrentStep }: ReviewProps) {
  const utcOffset = dayjs().utcOffset() / 60;
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const handleConfirmationDialogOpen = () => setConfirmationDialogOpen(!confirmationDialogOpen);
  return (
    <>
      <Typography variant="h3">{roundInfo.voteTitle}</Typography>
      <Typography>Review everything on this page carefully, as it cannot be changed once you create the voting round.</Typography>
      <Typography variant="h4" className="mt-10">
        Vote set up
      </Typography>
      <div className="container grid grid-cols-8 gap-4 ">
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
          <div className="col-span-6 col-start-3">
            <Textarea className="max-w-md" disabled={true} value={roundInfo.snapshotFile} />
          </div>
        )}
        <Row label="Min votes" value={roundInfo.minimumVotes?.toString() ?? "-"} />
        <div className="col-span-2">
          <Link
            label="Edit vote set up"
            onClick={(e) => {
              e.preventDefault();
              setCurrentStep(VoteCreationSteps.RoundInfo);
            }}
          />
        </div>
      </div>
      <Typography variant="h4" className="mt-10">
        Question or category
      </Typography>
      <div className="container grid grid-cols-8 gap-4 ">
        <Row label="Question or category" value={question.questionTitle} />
        <Row label="description" value={question.questionDescription ?? "-"} />
        <Row label="Options" value={question.answers[0]} />
        {question.answers.slice(1).map((answer, index) => (
          <div key={index} className="col-span-6 col-start-3">
            <Typography className="m-0">{answer}</Typography>
          </div>
        ))}
        <div className="col-span-2">
          <Link
            label="Edit question"
            onClick={(e) => {
              e.preventDefault();
              setCurrentStep(VoteCreationSteps.Questions);
            }}
          />
        </div>
      </div>
      <div className="mt-8 flex gap-6 justify-end max-w-md">
        <Button variant="outlined" color="blue-gray" onClick={back}>
          Back
        </Button>
        <Button onClick={() => setConfirmationDialogOpen(true)}>Create voting round</Button>
      </div>
      <ConfirmationDialog handleOpen={handleConfirmationDialogOpen} open={confirmationDialogOpen} onConfirm={onCreate} />
    </>
  );
}
