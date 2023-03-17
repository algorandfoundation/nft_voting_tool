import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStep } from "./state";
import { VoteCreationSteps } from "./VoteCreationSteps";

const routes = {
  [VoteCreationSteps.RoundInfo]: "/create",
  [VoteCreationSteps.Questions]: "/create/questions",
  [VoteCreationSteps.Review]: "/create/review",
  [VoteCreationSteps.Sign]: "/create/sign",
};

export const useStepRedirect = (step: VoteCreationSteps) => {
  const currentStep = useStep();
  const navigate = useNavigate();
  useEffect(() => {
    if (currentStep < step) {
      navigate(routes[currentStep], {
        replace: true,
      });
    }
  }, [currentStep, step]);
};
