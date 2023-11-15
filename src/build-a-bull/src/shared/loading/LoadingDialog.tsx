import { Dialog, DialogContent, DialogTitle } from '@mui/material'
import { Loading, LoadingProps } from './Loading'

type LoadingDialogProps = {
  loading: boolean
  title: string
} & LoadingProps

export const LoadingDialog = ({ loading, title, note }: LoadingDialogProps) => (
  <Dialog open={loading}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <Loading note={note} />
    </DialogContent>
  </Dialog>
)
