import { useState } from "react";
import QuestionForm, { QuestionFormProps } from "./QuestionForm";
import RoundInfoForm, { Fields as RoundInfoFIelds, RoundInfoFormProps } from "./RoundInfoForm";
import { Steps } from "./Steps";
import { VoteCreationSteps } from "./VoteCreationSteps";

function VoteCreationPage() {
  const [currentStep, setCurrentStep] = useState(VoteCreationSteps.RoundInfo);
  const [roundInfo, setRoundInfo] = useState<RoundInfoFIelds>({
    end: "",
    // @ts-expect-error this cannot be undefined
    minimumVotes: "",
    snapshotFile: undefined,
    start: "",
    voteDescription: "",
    voteInformationUrl: "",
    voteTitle: "",
  });

  const handleRoundInfoSubmit: RoundInfoFormProps["onSubmit"] = (data) => {
    setRoundInfo(data);
    setCurrentStep(VoteCreationSteps.Questions);
    document.documentElement.scrollTop = 0;
  };

  const handleQuestionSubmit: QuestionFormProps["onSubmit"] = (data) => {
    setCurrentStep(VoteCreationSteps.Questions);
    document.documentElement.scrollTop = 0;
  };

  return (
    <>
      <Steps currentStep={currentStep} />
      <div className="mt-8 w-full max-w-md">
        {currentStep === VoteCreationSteps.RoundInfo && (
          <RoundInfoForm onSubmit={(data) => handleRoundInfoSubmit(data)} defaultValues={roundInfo} />
        )}
        {currentStep === VoteCreationSteps.Questions && roundInfo?.voteTitle && (
          <QuestionForm
            onSubmit={(data) => handleQuestionSubmit(data)}
            voteTitle={roundInfo.voteTitle}
            back={() => setCurrentStep(VoteCreationSteps.RoundInfo)}
          />
        )}
      </div>
    </>
  );
}

export default VoteCreationPage;
