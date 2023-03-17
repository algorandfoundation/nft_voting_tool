import { Typography } from "@material-tailwind/react";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { SubmitButton } from "../../shared/forms/components/submit-button/SubmitButton";
import { ValidatedForm } from "../../shared/forms/validated-form/ValidatedForm";

const formSchema = zfd.formData({
  voteTitle: zfd.text(),
  voteDescription: zfd.text(),
  voteInformationUrl: zfd.text(),
  start: zfd.text(),
  end: zfd.text(),
  snapshotFile: zfd.text(z.string().optional()),
  minimumVotes: zfd.numeric(z.number().optional()),
});

type Fields = z.infer<typeof formSchema>;

export interface RoundInfoFormProps {
  defaultValues: Fields;
  onSubmit?: (data: Fields) => void | Promise<void>;
}

export default function RoundInfoForm({ onSubmit, defaultValues }: RoundInfoFormProps) {
  return (
    <>
      <Typography variant="h3">New Voting Round</Typography>
      <ValidatedForm validator={formSchema} onSubmit={onSubmit} defaultValues={defaultValues}>
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
    </>
  );
}
