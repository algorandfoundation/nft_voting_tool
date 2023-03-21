import { Step, StepLabel, Stepper, Typography } from "@mui/material";

type StepsProps = {
  activeStep: number;
};

const steps = ["Info", "Q&A", "Review", "Sign"];

export const Steps = ({ activeStep }: StepsProps) => {
  return (
    <>
      <div>
        <Typography variant="h3">New voting round</Typography>
      </div>
      <div className="max-w-2xl mt-10">
        <Stepper sx={{ position: "relative", left: "calc(-10%)" }} alternativeLabel activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </div>
    </>
  );
};
