import { Typography } from "@mui/material";

type RowProp = {
  label: string;
  value: string;
};
export const Row = ({ label, value }: RowProp) => (
  <>
    <div className="col-span-2">
      <Typography className="m-0" color="gray">
        {label}
      </Typography>
    </div>
    <div className="col-span-6">
      <Typography className="m-0">{value}</Typography>
    </div>
  </>
);
