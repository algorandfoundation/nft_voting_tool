import { Button } from "@mui/material";
import React from "react";

export type SubmitButtonProps = {
  className?: string;
  children?: React.ReactNode;
} & Parameters<typeof Button>[0];

export function SubmitButton({ className, children, ...rest }: SubmitButtonProps) {
  return (
    <Button variant="contained" type="submit" className={className} {...rest}>
      {children}
    </Button>
  );
}
