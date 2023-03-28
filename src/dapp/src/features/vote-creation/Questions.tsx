import { Button, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { SubmitButton } from '../../shared/forms/components/submit-button/SubmitButton'
import { ValidatedForm } from '../../shared/forms/validated-form/ValidatedForm'
import { useQuestions, useRoundInfo, useSetQuestions, useSetStep } from './state'
import { Steps } from './Steps'
import { useStepRedirect } from './useStepRedirect'
import { VoteCreationSteps } from './VoteCreationSteps'

export const formSchema = zfd.formData({
  questionTitle: zfd.text(z.string().trim().min(1, 'Required')),
  questionDescription: zfd.text(z.string().trim().optional()),
  answers: zfd.repeatable(z.array(zfd.text(z.string().trim().min(1, 'Required'))).min(2, 'Must have at least 2 answers')),
})

type Fields = z.infer<typeof formSchema>

export default function Questions() {
  const { voteTitle } = useRoundInfo()
  const questions = useQuestions()
  const setQuestions = useSetQuestions()
  const navigate = useNavigate()
  const setStep = useSetStep()
  const onSubmit = (data: Fields) => {
    setQuestions(data)
    setStep(VoteCreationSteps.Review)
    navigate('/create/review')
  }
  useStepRedirect(VoteCreationSteps.Questions)
  return (
    <>
      <Steps activeStep={VoteCreationSteps.Questions} />
      <div className="mt-8 w-full max-w-md">
        <Typography variant="h3">Vote questions and answers</Typography>
        <ValidatedForm validator={formSchema} onSubmit={onSubmit} defaultValues={questions}>
          {(helper) => (
            <>
              {helper.textField({
                label: 'Question or Category',
                field: 'questionTitle',
              })}
              {helper.textField({
                label: 'Question description',
                field: 'questionDescription',
              })}
              {helper.textFields({
                label: 'Response options',
                field: 'answers',
                minimumItemCount: 2,
              })}

              <div className="!mt-12">
                <div className="flex gap-6 justify-end">
                  <Button variant="outlined" onClick={() => navigate(-1)}>
                    Back
                  </Button>
                  <SubmitButton>Next</SubmitButton>
                </div>
              </div>
            </>
          )}
        </ValidatedForm>
      </div>
    </>
  )
}
