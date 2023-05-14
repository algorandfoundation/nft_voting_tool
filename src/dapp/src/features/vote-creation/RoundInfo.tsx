import { ValidatedForm, z, zfd } from '@makerx/forms-mui'
import { Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { VoteType } from '../../shared/types'
import { Steps } from './Steps'
import { VoteCreationSteps } from './VoteCreationSteps'
import { useRoundInfo, useSetRoundInfo, useSetStep } from './state'

const formSchema = zfd.formData({
  voteType: zfd.numeric(z.nativeEnum(VoteType)),
  voteTitle: zfd.text(z.string().trim().min(1, 'Required')),
  voteDescription: zfd.text(z.string().trim().min(1, 'Required')),
  voteInformationUrl: zfd.text(z.string().trim().url().optional()),
  start: zfd.text(),
  end: zfd.text(),
  snapshotFile: zfd.text(z.string()),
  minimumVotes: zfd.numeric(z.number({ invalid_type_error: 'Should be a number' }).optional()),
})

export type Fields = z.infer<typeof formSchema>

export default function RoundInfo() {
  const roundInfo = useRoundInfo()
  const setRoundInfo = useSetRoundInfo()
  const navigate = useNavigate()
  const setStep = useSetStep()
  const onSubmit = (data: Fields) => {
    setRoundInfo(data)
    setStep(VoteCreationSteps.Questions)
    navigate('/create/questions')
  }
  return (
    <>
      <Steps activeStep={VoteCreationSteps.RoundInfo} />
      <div className="mt-8 w-full max-w-lg">
        <Typography variant="h4">Vote information</Typography>
        <ValidatedForm className="flex-row space-y-4" validator={formSchema} onSubmit={onSubmit} defaultValues={roundInfo}>
          {(helper) => (
            <>
              {helper.textField({
                label: 'Vote title',
                field: 'voteTitle',
              })}
              {helper.textField({
                label: 'Vote type',
                field: 'voteType',
              })}
              {helper.textareaField({
                label: 'Vote description',
                field: 'voteDescription',
                maxLength: 200,
                hint: 'Max 200 characters',
              })}
              {helper.textField({
                label: 'Vote information URL',
                field: 'voteInformationUrl',
                hint: 'URL where voters can get more information about the vote',
              })}
              <div className="flex justify-between">
                {helper.dateTimeField({
                  label: 'Start',
                  field: 'start',
                  toISO: (date) => dayjs(date).toISOString(),
                  fromISO: (date) => dayjs(date) as unknown as Date,
                  longHint: 'Set the start and end time in your local timezone',
                })}
                {helper.dateTimeField({
                  label: 'End',
                  field: 'end',
                  toISO: (date) => dayjs(date).toISOString(),
                  fromISO: (date) => dayjs(date) as unknown as Date,
                })}
              </div>
              {helper.textFileFormField({
                label: 'Allowlist snapshot file',
                field: 'snapshotFile',
                hint: 'Upload snapshot .csv file',
                longHint:
                  'Upload a CSV file with a single column containing the addresses for the allowlist. Do not include a header line.',
              })}
              {helper.textField({
                label: 'Minimum number of votes (quorum)',
                field: 'minimumVotes',
              })}
              <div className="text-right">{helper.submitButton({ label: 'Next', className: 'mt-8' })}</div>
            </>
          )}
        </ValidatedForm>
      </div>
    </>
  )
}
