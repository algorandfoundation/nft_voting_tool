import { Typography } from '@mui/material'
import { ReactNode } from 'react'

type RowProp = {
  label: string
  value: string | ReactNode
}
export const Row = ({ label, value }: RowProp) => (
  <>
    <div className="col-span-2">
      <Typography className="m-0" color="gray">
        {label}
      </Typography>
    </div>
    <div className="col-span-6">{typeof value === 'string' ? <Typography className="m-0">{value}</Typography> : <>{value}</>}</div>
  </>
)
