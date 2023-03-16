import { Step } from "./Step";
import { VoteCreationSteps } from "./VoteCreationSteps";

type StepsProps = {
  currentStep: VoteCreationSteps;
};
export const Steps = ({ currentStep: currentStep }: StepsProps) => {
  return (
    <div className="flex gap-16">
      <Step step={VoteCreationSteps.RoundInfo} currentStep={currentStep} />
      <Step step={VoteCreationSteps.Questions} currentStep={currentStep} />
      <Step step={VoteCreationSteps.Review} currentStep={currentStep} />
      <Step step={VoteCreationSteps.Sign} currentStep={currentStep} />
    </div>
  );
};
