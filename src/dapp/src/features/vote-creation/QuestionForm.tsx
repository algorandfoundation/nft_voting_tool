import { Button, Typography } from "@material-tailwind/react";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { SubmitButton } from "../../shared/forms/components/submit-button/SubmitButton";
import { ValidatedForm } from "../../shared/forms/validated-form/ValidatedForm";

export const formSchema = zfd.formData({
  questionTitle: zfd.text(),
  questionDescription: zfd.text(z.string().optional()),
  answers: zfd.repeatable(z.array(zfd.text(z.string().trim().min(1, "Required"))).min(2, "Must have at least 2 answers")),
});

export type Fields = z.infer<typeof formSchema>;

const defaultValues: Partial<Fields> = {
  questionTitle: "",
  questionDescription: "",
  answers: [" ", " "],
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
            {helper.textFields({
              label: "Response options",
              field: "answers",
              minimumItemCount: 2,
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
