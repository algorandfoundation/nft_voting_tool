import { Alert, Button, Link, Stack, TextField, Typography } from '@mui/material'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../../shared/api'
import { LoadingDialog } from '../../../shared/loading/LoadingDialog'
import {
  useAppReference,
  useAuth,
  useQuestions,
  useResetCreateRound,
  useReviewStep,
  useRoundInfo,
  useSetAppReference,
  useSetAuth,
  useSetReviewStep,
} from '../state'
import { useStepRedirect } from '../useStepRedirect'
import { VoteCreationReviewSteps, VoteCreationSteps } from '../VoteCreationSteps'
import { ConfirmationDialog } from './ConfirmationDialog'
import { Row } from './Row'

import { useWallet } from '@txnlab/use-wallet'
import dayjs from 'dayjs'
import { getTimezone } from '../../../shared/getTimezone'
import { getWalletAddresses } from '../../../shared/wallet'
import { Steps } from '../Steps'

export default function Review() {
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const { activeAddress, signer: transactionSigner } = useWallet()
  const toggleConfirmationDialog = () => setConfirmationDialogOpen(!confirmationDialogOpen)
  const roundInfo = useRoundInfo()
  const questions = useQuestions()
  const [authData, setAuth] = [useAuth(), useSetAuth()]
  const [appData, setApp] = [useAppReference(), useSetAppReference()]
  const navigate = useNavigate()
  const reviewStep = useReviewStep()
  const setReviewStep = useSetReviewStep()
  useStepRedirect(VoteCreationSteps.Review)
  const resetCreateState = useResetCreateRound()
  const { auth, create, bootstrap } = api.useCreateVotingRound()
  const loading = auth.loading || create.loading || bootstrap.loading
  const error = `${auth.error !== null ? auth.error : ''}${create.error !== null ? create.error : ''}${
    bootstrap.error !== null ? bootstrap.error : ''
  }`
  const signer = { addr: activeAddress!, signer: transactionSigner }
  const confirm = async () => {
    setConfirmationDialogOpen(false)
    if (!activeAddress) {
      throw new Error('User does not have an active address')
    }
    switch (reviewStep) {
      case VoteCreationReviewSteps.Auth:
        setAuth(await auth.execute({ signer }))
        break
      case VoteCreationReviewSteps.Create:
        // eslint-disable-next-line no-case-declarations
        setApp(
          await create.execute({
            auth: authData,
            newRound: { ...roundInfo, ...questions },
            signer,
          }),
        )

        break
      case VoteCreationReviewSteps.Bootstrap:
        await bootstrap.execute({
          app: appData,
          signer,
        })
        break
    }
    if (reviewStep === VoteCreationReviewSteps.Bootstrap) {
      resetCreateState()
      navigate('/', {})
      return
    }

    setReviewStep(reviewStep + 1)
    setConfirmationDialogOpen(true)
  }
  return (
    <>
      <Steps activeStep={VoteCreationSteps.Review} />
      <div className="max-w-3xl">
        <Typography variant="h3">{roundInfo.voteTitle}</Typography>
        <Alert className="max-w-xl bg-algorand-warning font-semibold" icon={false}>
          Review everything on this page carefully, as it cannot be changed once you create the voting round.
        </Alert>
        <Typography variant="h4" className="mt-6 mb-2">
          Vote set up
        </Typography>
        <div className="container grid grid-cols-8 gap-4">
          <Row label="Vote title" value={roundInfo.voteTitle} />
          <Row label="Vote description" value={roundInfo.voteDescription ?? '-'} />
          <Row label="Vote information" value={roundInfo.voteInformationUrl} />
          <Row label="Start date" value={dayjs(roundInfo.start).format('LLL')} />
          <Row label="End date" value={dayjs(roundInfo.end).format('LLL')} />
          <Row label="Timezone" value={getTimezone(dayjs(roundInfo.start))} />
          <Row
            label="Snapshot file"
            value={roundInfo.snapshotFile ? `${getWalletAddresses(roundInfo.snapshotFile).length.toLocaleString()} wallets` : '-'}
          />
          {roundInfo.snapshotFile && (
            <div className="col-span-6 col-start-3 max-w-xs">
              <TextField rows={6} fullWidth multiline className="max-w-md" disabled value={roundInfo.snapshotFile} />
            </div>
          )}
          <Row label="Min votes" value={roundInfo.minimumVotes?.toString() ?? '-'} />
          <div className="col-span-2">
            <Link
              onClick={(e) => {
                e.preventDefault()
                navigate(-2)
              }}
              href="#"
            >
              Edit vote information
            </Link>
          </div>
        </div>
        <Typography variant="h4" className="mt-6 mb-2">
          Question or category
        </Typography>
        <div className="container grid grid-cols-8 gap-4 ">
          <Row label="Question or category" value={questions.questionTitle} />
          <Row label="Description" value={questions.questionDescription ?? '-'} />
          <Row
            label="Options"
            value={
              <Stack spacing={1}>
                {questions.answers.map((option, index) => (
                  <Button className="w-64 sm:w-72 uppercase" key={index} variant="outlined">
                    {option}
                  </Button>
                ))}
              </Stack>
            }
          />

          <div className="col-span-2">
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault()
                navigate(-1)
              }}
            >
              Edit question
            </Link>
          </div>
        </div>
        <div className="mt-8 flex gap-6 justify-end max-w-xl">
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button variant="contained" onClick={() => setConfirmationDialogOpen(true)}>
            Create voting round
          </Button>
        </div>
        {error && (
          <Alert className="max-w-xl mt-4 text-white bg-red-600 font-semibold" icon={false}>
            <Typography>Could not create voting round contract:</Typography>
            <Typography>{error}</Typography>
          </Alert>
        )}
        <ConfirmationDialog
          showCancel={reviewStep < VoteCreationReviewSteps.Bootstrap}
          title={
            reviewStep === VoteCreationReviewSteps.Auth
              ? 'Authorise creation of voting metadata in IPFS (1/3)'
              : reviewStep === VoteCreationReviewSteps.Create
              ? 'Confirm voting round creation (2/3)'
              : 'Finalise voting round setup (3/3)'
          }
          onCancel={() => {
            toggleConfirmationDialog()
            setReviewStep(VoteCreationReviewSteps.Auth)
          }}
          open={confirmationDialogOpen}
          onConfirm={confirm}
        >
          <div>
            You will be asked to sign a transaction to{' '}
            {reviewStep === VoteCreationReviewSteps.Auth
              ? 'authorise metadata upload to IPFS'
              : reviewStep === VoteCreationReviewSteps.Create
              ? 'create this voting round. Note: No further changes are possible once you sign'
              : 'fund the voting round smart contract and initialise the round'}
            .
          </div>
          <div className="mt-6">It can take up to 30 seconds to process once you sign the transaction.</div>
        </ConfirmationDialog>
        <LoadingDialog
          loading={loading}
          title="Processing..."
          note="It can take up to 30 seconds to progress once you sign each transaction."
        />
      </div>
    </>
  )
}
