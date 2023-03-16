import { Typography } from "@material-tailwind/react";
import VoteCreationForm, { VoteCreationFormProps } from "./VoteCreationForm";

function VoteCreationPage() {
  const handleSubmit: VoteCreationFormProps["onSubmit"] = (data) => {
    console.log("form submit", data);
  };

  return (
    <>
      <Typography variant="h3">New Voting Round</Typography>
      <div className="w-full max-w-md">
        <VoteCreationForm onSubmit={(data) => handleSubmit(data)} />
      </div>
    </>
  );
}

export default VoteCreationPage;
