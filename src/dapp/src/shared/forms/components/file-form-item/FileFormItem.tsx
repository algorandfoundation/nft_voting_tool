import { Controller, useFormContext } from "react-hook-form";
import type { FormItemProps } from "../form-item/FormItem";
import { FormItem } from "../form-item/FormItem";

export type FileFormItemProps<TSchema extends Record<string, any> = Record<string, any>> = Omit<FormItemProps<TSchema>, "children">;

export function FileFormItem<TSchema extends Record<string, any> = Record<string, any>>({
  field,
  disabled,
  label,
  className,
  hint,
}: FileFormItemProps<TSchema>) {
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
        render={({ field: { onChange, onBlur, value, name } }) => (
          <>
            <input
              className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100"
              id="snapshot"
              type="file"
              onChange={onChange}
              onBlur={onBlur}
              value={value}
              name={name}
            />
          </>
        )}
      />
    </FormItem>
  );
}
