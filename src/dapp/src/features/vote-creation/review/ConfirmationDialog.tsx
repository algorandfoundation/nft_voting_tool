import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";

type ConfirmationDialogProps = {
  open: boolean;
  handleOpen: () => void;
  onConfirm: () => void;
};
export const ConfirmationDialog = ({ open, handleOpen, onConfirm }: ConfirmationDialogProps) => (
  <Dialog open={open} onClose={handleOpen}>
    <DialogTitle>Confirm voting round creation</DialogTitle>
    <DialogContent>
      <div>You will be asked to sign a transaction to create this voting round. No changes are possible once you sign.</div>
      <div className="mt-6">It can take up to 30 seconds to create the voting round once you sign the transaction.</div>
    </DialogContent>
    <DialogActions>
      <Button variant="text" color="secondary" onClick={handleOpen} className="mr-1">
        Cancel
      </Button>
      <Button onClick={onConfirm}>Confirm</Button>
    </DialogActions>
  </Dialog>
);
