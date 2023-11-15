import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'

type ConfirmationDialogProps = {
  title: string | JSX.Element
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  showCancel: boolean
  children: JSX.Element[]
}
export const ConfirmationDialog = ({ open, title, showCancel, children, onCancel, onConfirm }: ConfirmationDialogProps) => (
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  <Dialog open={open} onClose={showCancel ? onCancel : () => {}}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>{children}</DialogContent>
    <DialogActions>
      {showCancel && (
        <Button variant="outlined" onClick={onCancel} className="mr-1">
          Cancel
        </Button>
      )}
      <Button variant="contained" onClick={onConfirm}>
        Confirm
      </Button>
    </DialogActions>
  </Dialog>
)
