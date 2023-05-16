import { ValidatedForm, z, zfd } from '@makerx/forms-mui'
import { Typography } from '@mui/material'
import { decodeAddress } from 'algosdk'
import dayjs from 'dayjs'
import Papa from 'papaparse'
import { useNavigate } from 'react-router-dom'
import { SnapshotRow } from '../../../../dapp/src/shared/csvSigner'
import { useRoundInfo, useSetRoundInfo } from './state'

export type Proposal = {
  title: string
  description: string
  link: string
  category: string
  focus_area: string
  threshold: number
  ask: number
}

const formSchema = zfd.formData({
  voteTitle: zfd.text(z.string().trim().min(1, 'Required')),
  voteDescription: zfd.text(z.string().trim().optional()),
  voteInformationUrl: zfd.text(z.string().trim().url().optional()),
  start: zfd.text(),
  end: zfd.text(),
  proposalFile: zfd.text(z.string().trim().min(1, 'Required').superRefine(validateProposalCsv)),
  snapshotFile: zfd.text(z.string().trim().min(1, 'Required').superRefine(validateSnapshotCsv)),
})

function validateProposalCsv(value: string, ctx: z.RefinementCtx) {
  const parsed = Papa.parse<Proposal>(value, { header: true })
  const requiredFields = ['title', 'description', 'link', 'category', 'focus_area', 'threshold', 'ask']
  if (parsed.errors.length > 0) {
    parsed.errors.forEach((error) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${error.message} ` + `on row: ${error.row + 1}`,
      })
    })
  }
  if (parsed.meta.fields) {
    if (
      !requiredFields.every((field) => {
        return parsed.meta.fields && parsed.meta.fields.includes(field)
      })
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `The csv must have a header row with the following fields: ${requiredFields.join(', ')}`,
      })
    }
  }
  if (parsed.data.length <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'No proposals found',
    })
  }
  parsed.data.forEach((proposal, index) => {
    requiredFields.forEach((field) => {
      if (!proposal[field as keyof Proposal]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `The proposal on row: ${index + 1} has no "${field}"`,
        })
      }
    })
  })
}

function validateSnapshotCsv(value: string, ctx: z.RefinementCtx) {
  const parsed = Papa.parse<SnapshotRow>(value, { header: true, delimiter: ',' })
  const requiredFields = ['address', 'weight']
  if (parsed.errors.length > 0) {
    parsed.errors.forEach((error) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${error.message} ` + `on row: ${error.row + 1}`,
      })
    })
  }
  if (parsed.meta.fields) {
    if (
      !requiredFields.every((field) => {
        return parsed.meta.fields && parsed.meta.fields.includes(field)
      })
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `The csv must have a header row with the following fields: ${requiredFields.join(', ')}`,
      })
    }
  }
  if (parsed.data.length <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'No addresses found',
    })
  }
  parsed.data.forEach((row, index) => {
    try {
      decodeAddress(row.address)
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `The address on row: ${index + 1} is not valid`,
      })
    }
    if (!row.weight) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `The address on row: ${index + 1} has no weight associated with it`,
      })
    }
  })
}

export type Fields = z.infer<typeof formSchema>

export default function RoundInfo() {
  const roundInfo = useRoundInfo()
  const setRoundInfo = useSetRoundInfo()
  const navigate = useNavigate()
  const onSubmit = (data: Fields) => {
    setRoundInfo(data)
    navigate('/create/review')
  }
  return (
    <>
      <div className="mt-8 w-full max-w-lg">
        <Typography variant="h4">Vote information</Typography>
        <ValidatedForm className="flex-row space-y-4" validator={formSchema} onSubmit={onSubmit} defaultValues={roundInfo}>
          {(helper) => (
            <>
              {helper.textField({
                label: 'Vote title',
                field: 'voteTitle',
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
                label: 'Proposals',
                field: 'proposalFile',
                hint: 'Upload a .csv file',
                longHint:
                  'Upload a CSV file with 5 columns containing the proposals. The headers should be "title", "description", "link", "category", "threshold"',
              })}
              {helper.textFileFormField({
                label: 'Allowlist snapshot file',
                field: 'snapshotFile',
                hint: 'Upload snapshot .csv file',
                longHint:
                  'Upload a CSV file with 2 columns containing the addresses and weights for the allowlist. The headers should be "address" and "weight".',
              })}
              <div className="text-right">{helper.submitButton({ label: 'Next', className: 'mt-8' })}</div>
            </>
          )}
        </ValidatedForm>
      </div>
    </>
  )
}
