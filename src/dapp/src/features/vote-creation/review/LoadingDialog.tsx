import { Dialog, DialogContent, DialogTitle, LinearProgress } from "@mui/material";

type LoadingDialogProps = {
  loading: boolean;
  title: string;
};
export const LoadingDialog = ({ loading, title }: LoadingDialogProps) => (
  <Dialog open={loading}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <LinearProgress />
      <div className="mt-6">It can take up to 30 seconds to create the voting round once you sign the transaction.</div>
    </DialogContent>
  </Dialog>
);
