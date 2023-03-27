import { TextField } from '@mui/material'
import { Controller, useFormContext } from 'react-hook-form'
import type { FormItemProps } from '../form-item/FormItem'
import { FormItem } from '../form-item/FormItem'

export type TextareaFormItemProps<TSchema extends Record<string, any> = Record<string, any>> = Omit<FormItemProps<TSchema>, 'children'> & {
  maxLength?: number
  hint?: string
}

export function TextareaFormItem<TSchema extends Record<string, any> = Record<string, any>>({
  field,
  disabled,
  label,
  className,
  hint,
  maxLength,
  ...textAreaProps
}: TextareaFormItemProps<TSchema>) {
  const {
    control,
    formState: { errors },
  } = useFormContext()
  const error = errors[field]
  return (
    <FormItem field={field} label={label} disabled={disabled} className={className} hint={hint}>
      <Controller
        name={field}
        control={control}
        render={({ field: { onChange, onBlur, value, name, ref } }) => (
          <TextField
            fullWidth
            inputProps={{
              maxLength,
              'aria-label': label,
            }}
            rows={4}
            multiline
            {...textAreaProps}
            error={!!error}
            onChange={onChange}
            onBlur={onBlur}
            value={value}
            name={name}
            ref={ref}
          />
        )}
      />
    </FormItem>
  )
}
