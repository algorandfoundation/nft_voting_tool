import { Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { SubmitButton } from "../../shared/forms/components/submit-button/SubmitButton";
import { ValidatedForm } from "../../shared/forms/validated-form/ValidatedForm";
import { useRoundInfo, useSetRoundInfo, useSetStep } from "./state";
import { Steps } from "./Steps";
import { VoteCreationSteps } from "./VoteCreationSteps";

const formSchema = zfd.formData({
  voteTitle: zfd.text(),
  voteDescription: zfd.text(),
  voteInformationUrl: zfd.text(),
  start: zfd.text(),
  end: zfd.text(),
  snapshotFile: zfd.text(z.string().optional()),
  minimumVotes: zfd.numeric(z.number({ invalid_type_error: "Should be a number" }).optional()),
});

export type Fields = z.infer<typeof formSchema>;

export default function RoundInfo() {
  const roundInfo = useRoundInfo();
  const setRoundInfo = useSetRoundInfo();
  const navigate = useNavigate();
  const setStep = useSetStep();
  const onSubmit = (data: Fields) => {
    setRoundInfo(data);
    setStep(VoteCreationSteps.Questions);
    navigate("/create/questions");
  };
  return (
    <>
      <Steps currentStep={VoteCreationSteps.RoundInfo} />
      <div className="mt-8 w-full max-w-md">
        <Typography variant="h3">New Voting Round</Typography>
        <ValidatedForm validator={formSchema} onSubmit={onSubmit} defaultValues={roundInfo}>
          {(helper) => (
            <>
              {helper.textField({
                label: "Vote title",
                field: "voteTitle",
              })}
              {helper.textareaField({
                label: "Vote description",
                field: "voteDescription",
              })}
              {helper.textField({
                label: "Vote information URL",
                field: "voteInformationUrl",

                hint: "URL where voters can get more information about the vote",
              })}
              {helper.dateTimeField({
                label: "Start",
                field: "start",
              })}
              {helper.dateTimeField({
                label: "End",
                field: "end",
              })}
              {helper.documentField({
                label: "Snapshot file",
                field: "snapshotFile",
              })}
              {helper.textField({
                label: "Minimum number of votes (quorum)",
                field: "minimumVotes",
              })}

              <div className="text-right">
                <SubmitButton className="mt-8">Next: Questions</SubmitButton>
              </div>
            </>
          )}
        </ValidatedForm>
      </div>
    </>
  );
}
