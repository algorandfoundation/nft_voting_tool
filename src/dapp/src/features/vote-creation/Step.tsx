import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Typography } from "@material-tailwind/react";
import { VoteCreationSteps } from "./VoteCreationSteps";

const stepNames: Record<VoteCreationSteps, string> = {
  [VoteCreationSteps.RoundInfo]: "Round info",
  [VoteCreationSteps.Questions]: "Q&A",
  [VoteCreationSteps.Review]: "Review",
  [VoteCreationSteps.Sign]: "Sign",
};

type StepProps = {
  step: VoteCreationSteps;
  currentStep: VoteCreationSteps;
};

export const Step = ({ step, currentStep }: StepProps) => (
  <div>
    <div className="text-12 flex border-black w-16 h-16 border-2 rounded-full justify-center items-center">
      {step < currentStep ? <FontAwesomeIcon className="fa-2xl" icon={faCheck} /> : <Typography>{step + 1}</Typography>}
    </div>
    <Typography variant="small" className="text-center">
      {stepNames[step]}
    </Typography>
  </div>
);
