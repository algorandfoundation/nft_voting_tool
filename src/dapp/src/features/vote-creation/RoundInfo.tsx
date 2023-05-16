import { ValidatedForm, z, zfd } from '@makerx/forms-mui'
import { Typography } from '@mui/material'
import { decodeAddress } from 'algosdk'
import dayjs from 'dayjs'
import Papa from 'papaparse'
import { useNavigate } from 'react-router-dom'
import { SnapshotRow } from '../../shared/csvSigner'
import { VoteType } from '../../shared/types'
import { Steps } from './Steps'
import { VoteCreationSteps } from './VoteCreationSteps'
import { SelectFormItem, SelectFormItemOption } from './select-form-item/SelectFormItem'
import { useRoundInfo, useSetRoundInfo, useSetStep } from './state'

function optionsForEnum<O extends object>(enumeration: O, includeEmpty?: boolean | string): SelectFormItemOption[] {
  return [
    ...(includeEmpty
      ? [
          {
            label: typeof includeEmpty === 'string' ? includeEmpty : ' ',
            value: '',
          },
        ]
      : []),
    ...Object.keys(enumeration)
      .filter((k) => Number.isNaN(+k))
      .map((k) => ({
        label: k,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: (enumeration[k as keyof O] as any).toString?.() ?? '',
      })),
  ]
}

const formSchema = zfd.formData({
  voteType: zfd.numeric(
    z.nativeEnum(VoteType).refine((x) => x !== VoteType.PARTITIONED_WEIGHTING && x !== VoteType.NO_SNAPSHOT, 'Invalid vote type'),
  ),
  voteTitle: zfd.text(z.string().trim().min(1, 'Required')),
  voteDescription: zfd.text(z.string().trim().min(1, 'Required')),
  voteInformationUrl: zfd.text(z.string().trim().url().optional()),
  start: zfd.text(),
  end: zfd.text(),
  snapshotFile: zfd.text(z.string()),
  minimumVotes: zfd.numeric(z.number({ invalid_type_error: 'Should be a number' }).optional()),
})
//todo: .superRefine(validateSnapshotCsv)

function validateSnapshotCsv(value: { voteType: VoteType; snapshotFile?: string }, ctx: z.RefinementCtx) {
  if (value.voteType === VoteType.NO_SNAPSHOT) {
    return
  }

  if (!value.snapshotFile) {
    ctx.addIssue({
      path: ['snapshotFile'],
      code: z.ZodIssueCode.custom,
      message: `Snapshot file required for ${value.voteType.toString()} voting round`,
    })
    return
  }

  const parsed = Papa.parse<SnapshotRow>(value.snapshotFile, { header: true, delimiter: ',' })
  const requiredFields = value.voteType > VoteType.NO_WEIGHTING ? ['address', 'weight'] : ['address']
  if (parsed.errors.length > 0) {
    parsed.errors.forEach((error) => {
      ctx.addIssue({
        path: ['snapshotFile'],
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
        path: ['snapshotFile'],
        code: z.ZodIssueCode.custom,
        message: `The csv must have a header row with the following fields: ${requiredFields.join(', ')}`,
      })
    }
  }
  if (parsed.data.length <= 0) {
    ctx.addIssue({
      path: ['snapshotFile'],
      code: z.ZodIssueCode.custom,
      message: 'No addresses found',
    })
  }
  parsed.data.forEach((row, index) => {
    try {
      decodeAddress(row.address)
    } catch (e) {
      ctx.addIssue({
        path: ['snapshotFile'],
        code: z.ZodIssueCode.custom,
        message: `The address on row: ${index + 1} is not valid`,
      })
    }
    if (!row.weight) {
      ctx.addIssue({
        path: ['snapshotFile'],
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
              <SelectFormItem<Fields>
                field="voteType"
                label="Vote type"
                options={optionsForEnum(VoteType, false).filter(
                  (o) => ![Number(VoteType.NO_SNAPSHOT).toString(), Number(VoteType.PARTITIONED_WEIGHTING).toString()].includes(o.value),
                )}
              ></SelectFormItem>
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
                  //'Vote type = NO_SNAPSHOT: Upload empty file.\n' +
                  "Vote type = NO_WEIGHTING: Upload a CSV file with a single column containing the addresses for the allowlist. Include a header line with a column called 'address'.\n" +
                  "Vote type = WEIGHTING: Upload a CSV with 2 columns: address, weighting containing the addresses for the allowlist and their weighting. Include a header line with columns called 'address' and 'weight'.",
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
