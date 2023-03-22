import { Dialog, DialogContent, DialogTitle, LinearProgress } from "@mui/material";

type LoadingDialogProps = {
  loading: boolean;
  title: string;
  note?: string;
};
export const LoadingDialog = ({ loading, title, note }: LoadingDialogProps) => (
  <Dialog open={loading}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <LinearProgress />
      <div className="mt-6">{note}</div>
    </DialogContent>
  </Dialog>
);
