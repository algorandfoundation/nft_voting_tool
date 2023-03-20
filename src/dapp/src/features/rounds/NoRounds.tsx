import { Typography } from "@mui/material";

type NoRoundsProps = {
  label: string;
};
export const NoRounds = ({ label }: NoRoundsProps) => <Typography>There are no {label} rounds created by this wallet.</Typography>;
