import dayjs from "dayjs";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import Datepicker from "react-tailwindcss-datepicker";
import { DateValueType } from "react-tailwindcss-datepicker/dist/types";
import type { FormItemProps } from "../form-item/FormItem";
import { FormItem } from "../form-item/FormItem";
import { TimePicker, TimeValue } from "./TimePicker";
import { useSubsequentRendersEffect } from "./useSubsequentRendersEffect";

const noTime = { hours: undefined, minutes: undefined, ampm: undefined };
export type DateTimeFormItemProps<TSchema extends Record<string, any> = Record<string, any>> = Omit<FormItemProps<TSchema>, "children"> &
  Partial<Parameters<typeof Datepicker>[0]>;

export function DateFormItem<TSchema extends Record<string, any> = Record<string, any>>({
  field,
  disabled,
  label,
  className,
  hint,
  ...inputProps
}: DateTimeFormItemProps<TSchema>) {
  const { control } = useFormContext();

  return (
    <FormItem field={field} label={label} hint={hint} disabled={disabled} className={className}>
      <Controller
        name={field}
        control={control}
        render={({ field: { onChange, onBlur, value } }) => {
          const [date, setDate] = useState<DateValueType>(
            value
              ? {
                  startDate: dayjs(value).format("YYYY-MM-DD"),
                  endDate: dayjs(value).format("YYYY-MM-DD"),
                }
              : null
          );
          const [time, setTime] = useState<TimeValue>(
            value
              ? {
                  hours: dayjs(value).format("h") as TimeValue["hours"],
                  minutes: dayjs(value).format("mm") as TimeValue["minutes"],
                  ampm: dayjs(value).format("A") as TimeValue["ampm"],
                }
              : noTime
          );

          useSubsequentRendersEffect(() => {
            if (date?.startDate) {
              if (!time.hours || !time.minutes || !time.ampm) {
                setTime({ hours: time.hours ?? "12", minutes: time.minutes ?? "00", ampm: time.ampm ?? "AM" });
              }

              const selectedHour = parseInt(time.hours ?? "0");
              const hour = selectedHour === 12 ? 0 : selectedHour;

              const dateTime = dayjs(date.startDate)
                .set("hour", hour + (time.ampm === "PM" ? 12 : 0))
                .set("minutes", parseInt(time.minutes ?? "0"))
                .format();
              onChange(dateTime);
            } else {
              onChange(undefined);
            }
            onBlur();
          }, [date, time]);
          return (
            <div className="flex gap-4">
              <div className="flex-none w-48 text-lg">
                <Datepicker {...inputProps} asSingle={true} useRange={false} onChange={setDate} value={date} />
              </div>
              <div className="flex-none">
                <TimePicker onChange={setTime} value={time} />
              </div>
            </div>
          );
        }}
      />
    </FormItem>
  );
}
