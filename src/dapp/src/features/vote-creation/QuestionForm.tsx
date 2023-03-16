import { Button, Typography } from "@material-tailwind/react";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { SubmitButton } from "../../shared/forms/components/submit-button/SubmitButton";
import { ValidatedForm } from "../../shared/forms/validated-form/ValidatedForm";

const formSchema = zfd.formData({
  questionTitle: zfd.text(),
  questionDescription: zfd.text(z.string().optional()),
});

const defaultValues: Partial<z.infer<typeof formSchema>> = {
  questionTitle: "",
  questionDescription: "",
};

export interface QuestionFormProps {
  voteTitle: string;
  onSubmit?: (data: z.infer<typeof formSchema>) => void | Promise<void>;
  back: () => void;
}

export default function QuestionForm({ onSubmit, voteTitle, back }: QuestionFormProps) {
  return (
    <>
      <Typography variant="h3">{voteTitle}</Typography>
      <ValidatedForm validator={formSchema} onSubmit={onSubmit} defaultValues={defaultValues}>
        {(helper) => (
          <>
            {helper.textField({
              label: "Question or Category",
              field: "questionTitle",
            })}
            {helper.textField({
              label: "Question description",
              field: "questionDescription",
            })}
            <div className="mt-8 flex gap-8 justify-end">
              <Button variant="outlined" color="blue-gray" onClick={back}>
                Back
              </Button>
              <SubmitButton>Next: Review</SubmitButton>
            </div>
          </>
        )}
      </ValidatedForm>
    </>
  );
}
