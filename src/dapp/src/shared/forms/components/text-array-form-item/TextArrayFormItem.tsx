import DeleteIcon from '@mui/icons-material/Delete'
import { Button, IconButton, TextField } from '@mui/material'
import { Controller, useFieldArray, useFormContext } from 'react-hook-form'
import type { FormItemProps } from '../form-item/FormItem'
import { FormItem } from '../form-item/FormItem'
import { ValidationErrorMessage } from '../validation-error-message/ValidationErrorMessage'

export type TextArrayFormItemProps<TSchema extends Record<string, any> = Record<string, any>> = Omit<FormItemProps<TSchema>, 'children'> & {
  minimumItemCount: number
}

export function TextArrayFormItem<TSchema extends Record<string, any> = Record<string, any>>({
  field,
  disabled,
  label,
  className,
  hint,
  minimumItemCount,
}: TextArrayFormItemProps<TSchema>) {
  const { control } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    name: field,
    rules: {
      required: true,
    },
  })

  const addOption = () => {
    // @ts-expect-error typescript doesn't like this but it works
    append(' ')
  }

  return (
    <FormItem field={field} label={label} hint={hint} disabled={disabled} className={className}>
      <div className="flex-row space-y-4">
        {fields.map(({ id }, ix) => (
          <Controller
            key={id}
            name={`${field}.${ix}`}
            control={control}
            render={({ field: { onChange, onBlur, value, name, ref } }) => {
              const {
                formState: { errors },
              } = useFormContext()
              // @ts-expect-error typescript doesn't like this but it works
              const errorMessage = errors[field] ? errors[field][ix]?.message : ''

              return (
                <div>
                  <div className="flex space-x-2 items-center">
                    <TextField fullWidth error={!!errorMessage} onChange={onChange} onBlur={onBlur} value={value} name={name} ref={ref} />
                    {fields.length > minimumItemCount && (
                      <IconButton aria-label="delete" onClick={() => remove(ix)}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </div>
                  {errorMessage && <ValidationErrorMessage message={errorMessage} />}
                </div>
              )
            }}
          />
        ))}
        <div className="flex justify-end mt-4">
          <Button variant="contained" onClick={addOption}>
            Add another option
          </Button>
        </div>
      </div>
    </FormItem>
  )
}
