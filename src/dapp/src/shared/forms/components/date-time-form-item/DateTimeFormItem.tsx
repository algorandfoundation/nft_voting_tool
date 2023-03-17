import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { Controller, useFormContext } from "react-hook-form";
import type { FormItemProps } from "../form-item/FormItem";
import { FormItem } from "../form-item/FormItem";

const noTime = { hours: undefined, minutes: undefined, ampm: undefined };
export type DateTimeFormItemProps<TSchema extends Record<string, any> = Record<string, any>> = Omit<FormItemProps<TSchema>, "children">;

export function DateFormItem<TSchema extends Record<string, any> = Record<string, any>>({
  field,
  disabled,
  label,
  className,
  hint,
}: DateTimeFormItemProps<TSchema>) {
  const { control } = useFormContext();

  return (
    <FormItem field={field} label={label} hint={hint} disabled={disabled} className={className}>
      <Controller
        name={field}
        control={control}
        render={({ field: { onChange, onBlur, value } }) => {
          return (
            <div className="flex gap-4">
              <DateTimePicker onChange={(v) => onChange(dayjs(v).format())} value={dayjs(value)} />
            </div>
          );
        }}
      />
    </FormItem>
  );
}
