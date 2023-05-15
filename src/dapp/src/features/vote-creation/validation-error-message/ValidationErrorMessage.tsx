import { Typography } from '@mui/material'
import type { FieldError, FieldErrorsImpl, Merge } from 'react-hook-form'

export interface ValidationErrorMessageProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message?: string | FieldError | Merge<FieldError, FieldErrorsImpl<any>>
}

export const ValidationErrorMessage = ({ message }: ValidationErrorMessageProps) => (
  <Typography color="error">{message?.toString()}</Typography>
)
