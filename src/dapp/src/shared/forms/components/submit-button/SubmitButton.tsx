import { Button } from "@material-tailwind/react";
import clsx from "clsx";
import React from "react";

export type SubmitButtonProps = {
  className?: string;
  children?: React.ReactNode;
} & Parameters<typeof Button>[0];

export function SubmitButton({ className, children, ...rest }: SubmitButtonProps) {
  return (
    <Button type="submit" className={clsx(className)} {...rest}>
      {children}
    </Button>
  );
}
