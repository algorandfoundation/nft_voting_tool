import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from "@material-tailwind/react";

type ConfirmationDialogProps = {
  open: boolean;
  handleOpen: () => void;
  onConfirm: () => void;
};
export const ConfirmationDialog = ({ open, handleOpen, onConfirm }: ConfirmationDialogProps) => (
  <Dialog open={open} handler={handleOpen}>
    <DialogHeader>Confirm voting round creation</DialogHeader>
    <DialogBody divider>
      <div>You will be asked to sign a transaction to create this voting round. No changes are possible once you sign.</div>
      <div className="mt-6">It can take up to 30 seconds to create the voting round once you sign the transaction.</div>
    </DialogBody>
    <DialogFooter>
      <Button variant="text" color="red" onClick={handleOpen} className="mr-1">
        Cancel
      </Button>
      <Button onClick={onConfirm}>Confirm</Button>
    </DialogFooter>
  </Dialog>
);
