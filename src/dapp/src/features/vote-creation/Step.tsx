import CheckIcon from '@mui/icons-material/Check'
import { Typography } from '@mui/material'
import { VoteCreationSteps } from './VoteCreationSteps'

const stepNames: Record<VoteCreationSteps, string> = {
  [VoteCreationSteps.RoundInfo]: 'Round info',
  [VoteCreationSteps.Questions]: 'Q&A',
  [VoteCreationSteps.Review]: 'Review',
  [VoteCreationSteps.Sign]: 'Sign',
}

type StepProps = {
  step: VoteCreationSteps
  currentStep: VoteCreationSteps
}

export const Step = ({ step, currentStep }: StepProps) => (
  <div className="text-center">
    <div className="flex border-black border-solid w-16 h-16 border-2 rounded-full justify-center items-center">
      {step < currentStep ? <CheckIcon fontSize="large" /> : <Typography>{step + 1}</Typography>}
    </div>
    <Typography variant="caption">{stepNames[step]}</Typography>
  </div>
)
