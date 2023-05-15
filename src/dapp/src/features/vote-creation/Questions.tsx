import { ValidatedForm, z, zfd } from '@makerx/forms-mui'
import { Button, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { Steps } from './Steps'
import { VoteCreationSteps } from './VoteCreationSteps'
import { ArrayFormItems } from './array-form-items/ArrayFormItems'
import { useQuestions, useSetQuestions, useSetStep } from './state'
import { useStepRedirect } from './useStepRedirect'

export const formSchema = zfd.formData({
  questions: z.array(
    z.object({
      questionTitle: zfd.text(z.string().trim().min(1, 'Required')),
      questionDescription: zfd.text(z.string().trim().optional()),
      answers: z.array(zfd.text(z.string().trim().min(1, 'Required'))).min(2, 'Must have at least 2 answers'),
    }),
  ),
})

type Fields = z.infer<typeof formSchema>
const FieldArray = ArrayFormItems<Fields>

export default function Questions() {
  const questions = useQuestions()
  const setQuestions = useSetQuestions()
  const navigate = useNavigate()
  const setStep = useSetStep()
  const onSubmit = (data: Fields) => {
    setQuestions(data.questions)
    setStep(VoteCreationSteps.Review)
    navigate('/create/review')
  }
  useStepRedirect(VoteCreationSteps.Questions)
  return (
    <>
      <Steps activeStep={VoteCreationSteps.Questions} />
      <div className="mt-8 w-full max-w-md">
        <Typography variant="h3">Vote questions and answers</Typography>
        <ValidatedForm className="flex-row space-y-4" validator={formSchema} onSubmit={onSubmit} defaultValues={{ questions }}>
          {(helper) => (
            <>
              <FieldArray
                field="questions"
                label="Questions"
                minimumItemCount={1}
                defaultAppendValue={{ answers: [' ', ' '] }}
                itemLabel="question"
              >
                {(questionIndex) => (
                  <div key={`q${questionIndex}`}>
                    {helper.textField({
                      label: 'Question or Category',
                      field: `questions.${questionIndex}.questionTitle`,
                    })}
                    {helper.textField({
                      label: 'Question description',
                      field: `questions.${questionIndex}.questionDescription`,
                    })}
                    {helper.textFields({
                      label: 'Response options',
                      field: `questions.${questionIndex}.answers`,
                      minimumItemCount: 2,
                    })}
                  </div>
                )}
              </FieldArray>

              <div className="!mt-12">
                <div className="flex gap-6 justify-end">
                  <Button variant="outlined" onClick={() => navigate(-1)}>
                    Back
                  </Button>
                  {helper.submitButton({ label: 'Next' })}
                </div>
              </div>
            </>
          )}
        </ValidatedForm>
      </div>
    </>
  )
}
