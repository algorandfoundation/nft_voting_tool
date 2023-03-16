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
  snapshotFile: zfd.file(z.instanceof(File).optional()),
  minimumVotes: zfd.numeric(z.number().optional()),
});

export interface VoteCreationFormProps {
  onSubmit?: (data: z.infer<typeof formSchema>) => void | Promise<void>;
}

export default function VoteCreationForm({ onSubmit }: VoteCreationFormProps) {
  return (
    <ValidatedForm validator={formSchema} onSubmit={onSubmit} defaultValues={{ end: "AM" }}>
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

          <SubmitButton>Next: Questions</SubmitButton>
        </>
      )}
    </ValidatedForm>
  );
}
