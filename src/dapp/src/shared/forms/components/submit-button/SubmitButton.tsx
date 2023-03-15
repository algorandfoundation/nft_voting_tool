import { Button } from "@material-tailwind/react";
import clsx from "clsx";
import React from "react";
import { useFormContext } from "react-hook-form";

export type SubmitButtonProps = {
  className?: string;
  children?: React.ReactNode;
} & Parameters<typeof Button>[0];

export function SubmitButton({ className, children, ...rest }: SubmitButtonProps) {
  const { formState } = useFormContext();
  return (
    <Button type="submit" className={clsx(className)} disabled={formState?.isSubmitting} {...rest}>
      {children}
    </Button>
  );
}
