import { Typography } from "@material-tailwind/react";
import clsx from "clsx";
import type { ReactElement } from "react";
import { cloneElement } from "react";
import { useFormContext } from "react-hook-form";
import type { FieldPath } from "react-hook-form/dist/types/path";
import { useFieldMetaData } from "../../hooks/useFieldMetadata";
import { ValidationErrorMessage } from "../validation-error-message/ValidationErrorMessage";

export interface FormItemProps<TSchema extends Record<string, any> = Record<string, any>> {
  className?: string;
  children: ReactElement;
  label: string;
  hint?: string;
  field: FieldPath<TSchema>;
  disabled?: boolean;
}

export function FormItem<TSchema extends Record<string, any> = Record<string, any>>({
  className,
  label,
  hint,
  children,
  field,
}: FormItemProps<TSchema>) {
  const {
    formState: { errors, touchedFields },
  } = useFormContext();
  const { required } = useFieldMetaData(field);
  const error = errors[field];
  return (
    <div>
      <Typography variant="lead">
        {label}
        {!required && " (optional)"}
      </Typography>
      {children && cloneElement(children, { className: clsx(children.props.className) })}
      {hint && (
        <Typography variant="small" className="text-gray-600">
          {hint}
        </Typography>
      )}
      {error && <ValidationErrorMessage message={error?.message} />}
    </div>
  );
}
