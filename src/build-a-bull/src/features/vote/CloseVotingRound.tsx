import { Alert, Button, Typography } from '@mui/material'
import { useState } from 'react'
import { LoadingDialog } from '../../shared/loading/LoadingDialog'
import { ConfirmationDialog } from '../vote-creation/review/ConfirmationDialog'

type CloseVotingRoundProps = {
  voteEnded: boolean
  loading: boolean
  closingVotingRoundError: string | null
  handleCloseVotingRound: () => Promise<void>
}

export const CloseVotingRound = ({ voteEnded, loading, handleCloseVotingRound, closingVotingRoundError }: CloseVotingRoundProps) => {
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false)

  return (
    <>
      <Typography className="mt-5" variant="h4">
        Vote administration
      </Typography>
      <div className="mt-3">
        <Typography>{voteEnded ? 'The end date for this vote has passed.' : 'The end date for this vote has not yet passed.'}</Typography>
      </div>
      <Button
        className="uppercase mt-4"
        variant="contained"
        onClick={() => {
          setConfirmationDialogOpen(true)
        }}
      >
        Close vote
      </Button>

      <ConfirmationDialog
        showCancel={true}
        title={'Confirm voting round close'}
        onCancel={() => {
          setConfirmationDialogOpen(false)
        }}
        open={confirmationDialogOpen}
        onConfirm={() => {
          setConfirmationDialogOpen(false)
          handleCloseVotingRound()
        }}
      >
        <div>
          <Typography>
            You will be asked to sign a transaction to close this voting round. No changes are possible once you sign.
          </Typography>
        </div>
        <div className="mt-6">
          <Typography>When you close the round, an NFT of the voting results will be created.</Typography>
        </div>
      </ConfirmationDialog>
      <LoadingDialog loading={loading} title="Closing voting round" note={'Please check your wallet for any pending transactions'} />
      {closingVotingRoundError && (
        <Alert className="max-w-xl mt-4 text-white bg-red-600 font-semibold" icon={false}>
          <Typography>Could not close the voting round:</Typography>
          <Typography>{closingVotingRoundError}</Typography>
        </Alert>
      )}
    </>
  )
}
