import { ValidatedForm, z, zfd } from '@makerx/forms-mui'
import { Button, Typography } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuestions, useSetQuestions, useSetStep } from './state'
import { Steps } from './Steps'
import { useStepRedirect } from './useStepRedirect'
import { VoteCreationSteps } from './VoteCreationSteps'

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

export default function Questions() {
  const questions = useQuestions()
  const [questionCount, setQuestionCount] = useState<number>(questions.length)
  const [optionCounts, setOptionCounts] = useState<number[]>(questions.map((q) => q.answers.length))
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
              {new Array(questionCount).fill(0).map((_, questionIndex) => (
                <div key={`q${questionIndex}`}>
                  {helper.textField({
                    label: 'Question or Category',
                    field: `questions.${questionIndex}.questionTitle`,
                  })}
                  {helper.textField({
                    label: 'Question description',
                    field: `questions.${questionIndex}.questionDescription`,
                  })}
                  {new Array(optionCounts[questionIndex]).fill(0).map((_, optionIndex) => (
                    <div key={`q${questionIndex}o${optionIndex}`}>
                      {helper.textField({
                        label: `Response ${optionIndex + 1}`,
                        field: `questions.${questionIndex}.answers.${optionIndex}`,
                      })}
                    </div>
                  ))}
                  <div className="text-right mt-4">
                    <Button
                      variant="outlined"
                      onClick={() => {
                        const counts = [...optionCounts]
                        counts[questionIndex] += 1
                        setOptionCounts(counts)
                      }}
                    >
                      Add another response option
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="contained"
                onClick={() => {
                  setQuestionCount(questionCount + 1)
                  setOptionCounts((counts) => [...counts, 2])
                }}
              >
                Add another question
              </Button>

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
