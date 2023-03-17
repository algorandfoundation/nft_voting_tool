import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, IconButton, Input, InputProps } from "@material-tailwind/react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import type { FormItemProps } from "../form-item/FormItem";
import { FormItem } from "../form-item/FormItem";
import { ValidationErrorMessage } from "../validation-error-message/ValidationErrorMessage";

export type TextArrayFormItemProps<TSchema extends Record<string, any> = Record<string, any>> = Omit<FormItemProps<TSchema>, "children"> &
  Partial<InputProps> & { minimumItemCount: number };

export function TextArrayFormItem<TSchema extends Record<string, any> = Record<string, any>>({
  field,
  disabled,
  label,
  className,
  hint,
  minimumItemCount,
  ...inputProps
}: TextArrayFormItemProps<TSchema>) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    name: field,
    rules: {
      required: true,
    },
  });

  const addOption = () => {
    // @ts-expect-error typescript doesn't like this but it works
    append(" ");
  };

  return (
    <FormItem field={field} label={label} hint={hint} disabled={disabled} className={className}>
      <>
        {fields.map(({ id }, ix) => {
          return (
            <Controller
              key={id}
              name={`${field}.${ix}`}
              control={control}
              render={({ field: { onChange, onBlur, value, name, ref } }) => {
                const {
                  formState: { errors },
                } = useFormContext();
                // @ts-expect-error typescript doesn't like this but it works
                const errorMessage = errors[field] ? errors[field][ix]?.message : "";

                return (
                  <div>
                    <div className="flex">
                      <Input
                        {...inputProps}
                        error={!!errorMessage}
                        variant="static"
                        onChange={onChange}
                        onBlur={onBlur}
                        value={value}
                        name={name}
                        ref={ref}
                      />
                      {fields.length > minimumItemCount && (
                        <IconButton color="gray" onClick={() => remove(ix)}>
                          <FontAwesomeIcon icon={faTrash} />
                        </IconButton>
                      )}
                    </div>
                    {errorMessage && <ValidationErrorMessage message={errorMessage} />}
                  </div>
                );
              }}
            />
          );
        })}
        <div className="flex justify-end mt-4">
          <Button onClick={addOption}>Add another option</Button>
        </div>
      </>
    </FormItem>
  );
}
