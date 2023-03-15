import { Typography } from "@material-tailwind/react";
import type { FieldError, FieldErrorsImpl, Merge } from "react-hook-form";

export interface ValidationErrorMessageProps {
  message?: string | FieldError | Merge<FieldError, FieldErrorsImpl<any>>;
}

export const ValidationErrorMessage = ({ message }: ValidationErrorMessageProps) => (
  <Typography variant="small" color="red">
    {message?.toString()}
  </Typography>
);
