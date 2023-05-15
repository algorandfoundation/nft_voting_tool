/* eslint-disable @typescript-eslint/no-explicit-any */
import DeleteIcon from '@mui/icons-material/Delete'
import PostAddIcon from '@mui/icons-material/PostAdd'
import { Box, Button, IconButton } from '@mui/material'
import { ReactElement } from 'react'
import { FieldArrayPath, useFieldArray } from 'react-hook-form'
import { FormItem, FormItemProps } from '../form-item/FormItem'

export type ArrayFormItemsProps<TSchema extends Record<string, any>> = Omit<FormItemProps<TSchema>, 'children'> & {
  minimumItemCount: number
  children: (index: number) => ReactElement[] | ReactElement
  field: FieldArrayPath<TSchema>
  itemLabel?: string
  defaultAppendValue?: any
}

export function ArrayFormItems<TSchema extends Record<string, any>>({
  field,
  disabled,
  label,
  className,
  hint,
  longHint,
  minimumItemCount,
  itemLabel,
  defaultAppendValue,
  children,
}: ArrayFormItemsProps<TSchema>) {
  const { fields, append, remove } = useFieldArray({
    name: field,
    rules: {
      required: true,
      minLength: minimumItemCount,
    },
  })

  const addOption = () => {
    append(defaultAppendValue || {})
  }

  return (
    <FormItem field={field} label={label} hint={hint} longHint={longHint} disabled={disabled} className={className}>
      <>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            marginBottom: 2,
          }}
        >
          {fields.map(({ id }, ix) => (
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }} key={id}>
              <div style={{ flexShrink: 1 }}>
                <PostAddIcon />
              </div>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} key={id}>
                {children(ix)}
              </Box>
              {fields.length > minimumItemCount && (
                <div style={{ flexShrink: 1 }}>
                  <IconButton aria-label="delete" onClick={() => remove(ix)}>
                    <DeleteIcon />
                  </IconButton>
                </div>
              )}
            </Box>
          ))}
        </Box>
        <div>
          <Button variant="outlined" onClick={addOption}>
            Add another {itemLabel || 'option'}
          </Button>
        </div>
      </>
    </FormItem>
  )
}
