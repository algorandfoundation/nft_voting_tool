import { Option, Select, SelectProps, ThemeProvider } from "@material-tailwind/react";

export type TimeComponentSelectProps = {
  options: string[];
} & Omit<Partial<SelectProps>, "children" | "ref">;

function TimeComponentSelect({ options, ...selectProps }: TimeComponentSelectProps) {
  return (
    <Select {...selectProps} className="" arrow={false} variant="static">
      {options.map((value) => (
        <Option key={value} value={value}>
          {value}
        </Option>
      ))}
    </Select>
  );
}

type Hours = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12";
type Minutes = "00" | "30";
type AmPm = "AM" | "PM";

export type TimeValue = {
  hours: Hours | undefined;
  minutes: Minutes | undefined;
  ampm: AmPm | undefined;
};

type TimePickerProps = {
  value: TimeValue;
  onChange: (value: TimeValue) => void;
};

export function TimePicker({ value, onChange }: TimePickerProps) {
  const theme: Partial<Parameters<typeof ThemeProvider>[0]["value"]> = {
    select: {
      styles: {
        base: {
          menu: {
            padding: "p-1",
          },
          option: {
            initial: {
              padding: "p-1",
            },
            active: {
              padding: "p-1",
            },
          },
          container: {
            minWidth: "w-10",
            width: "w-10",
          },
        },
      },
    },
  };

  return (
    <ThemeProvider value={theme as Parameters<typeof ThemeProvider>[0]["value"]}>
      <div className="flex">
        <div className="w-10">
          <TimeComponentSelect
            options={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]}
            value={value.hours}
            onChange={(val) => onChange({ ...value, hours: val as Hours })}
          />
        </div>
        <div className="w-10">
          <TimeComponentSelect
            options={["00", "30"]}
            value={value.minutes}
            onChange={(val) =>
              onChange({
                ...value,
                minutes: val as Minutes,
              })
            }
          />
        </div>
        <div className="w-10">
          <TimeComponentSelect options={["AM", "PM"]} value={value.ampm} onChange={(val) => onChange({ ...value, ampm: val as AmPm })} />
        </div>
      </div>
    </ThemeProvider>
  );
}
