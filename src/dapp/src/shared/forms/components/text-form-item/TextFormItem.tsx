import { Input, InputProps } from "@material-tailwind/react";
import { Controller, useFormContext } from "react-hook-form";
import type { FormItemProps } from "../form-item/FormItem";
import { FormItem } from "../form-item/FormItem";

export type TextFormItemProps<TSchema extends Record<string, any> = Record<string, any>> = Omit<FormItemProps<TSchema>, "children"> &
  Partial<InputProps>;

export function TextFormItem<TSchema extends Record<string, any> = Record<string, any>>({
  field,
  disabled,
  label,
  className,
  hint,
  ...inputProps
}: TextFormItemProps<TSchema>) {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const error = errors[field];
  return (
    <FormItem field={field} label={label} hint={hint} disabled={disabled} className={className}>
      <Controller
        name={field}
        control={control}
        render={({ field: { onChange, onBlur, value, name, ref } }) => (
          <Input {...inputProps} error={!!error} variant="static" onChange={onChange} onBlur={onBlur} value={value} name={name} ref={ref} />
        )}
      />
    </FormItem>
  );
}
