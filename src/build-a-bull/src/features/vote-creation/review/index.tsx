import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../../shared/api'
import { LoadingDialog } from '../../../shared/loading/LoadingDialog'
import {
  VoteCreationReviewSteps,
  useAppReference,
  useAuth,
  useResetCreateRound,
  useReviewStep,
  useRoundInfo,
  useSetAppReference,
  useSetAppSourceMaps,
  useSetAuth,
  useSetReviewStep,
} from '../state'
import { ConfirmationDialog } from './ConfirmationDialog'

import { useWallet } from '@makerx/use-wallet'
import Papa from 'papaparse'
import { VotingRoundGlobalState } from '@/shared/VotingRoundContract'
import { VoteType } from '@/shared/types'
import { ProposalCard } from '@/shared/ProposalCard'
import { VotingTime } from '../../vote/VotingTime'
import { Proposal } from '../RoundInfo'

export default function Review() {
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const { activeAddress, signer: transactionSigner } = useWallet()
  const roundInfo = useRoundInfo()
  const proposalsParsed = Papa.parse<Proposal>(roundInfo.proposalFile, { header: true }).data
  const proposals = proposalsParsed.filter((proposal) => !!proposal.title)

  const [authData, setAuth] = [useAuth(), useSetAuth()]
  const [appRef, setApp] = [useAppReference(), useSetAppReference()]
  const setAppSourceMaps = useSetAppSourceMaps()
  const navigate = useNavigate()
  const reviewStep = useReviewStep()
  const setReviewStep = useSetReviewStep()
  const resetCreateState = useResetCreateRound()
  const { auth, create, bootstrap } = api.useCreateVotingRound()
  const loading = auth.loading || create.loading || bootstrap.loading
  const error = `${auth.error !== null ? auth.error : ''}${create.error !== null ? create.error : ''}${
    bootstrap.error !== null ? bootstrap.error : ''
  }`
  const signer = { addr: activeAddress ?? '', signer: transactionSigner }
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
        const app = await create.execute({
          auth: authData,
          newRound: {
            ...roundInfo,
            voteType: VoteType.PARTITIONED_WEIGHTING,
            questions: proposals.map((proposal) => {
              return {
                questionTitle: proposal.title,
                questionDescription: proposal.description,
                metadata: {
                  link: proposal.link,
                  category: proposal.category,
                  focus_area: proposal.focus_area,
                  threshold: Number(proposal.threshold),
                  ask: Number(proposal.ask),
                },
                answers: ['yes'],
              }
            }),
          },
          signer,
        })
        setApp(app)
        if (app.compiledApproval && app.compiledClear) {
          setAppSourceMaps({
            approvalSourceMap: app.compiledApproval.sourceMap,
            clearSourceMap: app.compiledClear.sourceMap,
          })
        }

        break
      case VoteCreationReviewSteps.Bootstrap:
        await bootstrap.execute({
          app: appRef,
          signer,
          totalQuestionOptions: proposals.length,
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

  const previewGlobalState = {
    appId: 0,
    opUpAppId: 0,
    start_time: roundInfo.start,
    end_time: roundInfo.end,
    is_bootstrapped: false,
    close_time: '',
    metadata_ipfs_cid: '',
    nft_asset_id: 0,
    nft_image_url: '',
    option_counts: [],
    quorum: 0,
    total_options: 0,
    voter_count: 0,
    vote_type: undefined,
  } as VotingRoundGlobalState

  return (
    <>
      {/* <Steps activeStep={VoteCreationSteps.Review} /> */}
      <div>
        <Link
          onClick={(e) => {
            e.preventDefault()
            navigate(-1)
          }}
          href="#"
        >
          <Typography>&#60; Return to data upload</Typography>
        </Link>
        <div>
          <Typography variant="h3">Preview of {roundInfo.voteTitle}</Typography>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Typography variant="h4" className="mt-6 mb-2">
                Proposals
              </Typography>
              <div className="grid grid-cols-1 gap-4">
                {proposals.map((proposal) => {
                  return proposal && proposal.threshold ? (
                    <div key={proposal.title.replace(' ', '-')}>
                      <ProposalCard
                        link={proposal.link}
                        title={proposal.title}
                        description={proposal.description}
                        category={proposal.category}
                        focus_area={proposal.focus_area}
                        threshold={Number(proposal.threshold)}
                        ask={Number(proposal.ask)}
                        votesTally={0}
                      />
                    </div>
                  ) : null
                })}
              </div>
            </div>

            <div>
              <Typography variant="h4" className="mt-6 mb-2">
                Voting Addresses
              </Typography>
              {roundInfo.snapshotFile && (
                <div className="w-full ">
                  <TextField rows={20} fullWidth multiline className="bg-white" disabled value={roundInfo.snapshotFile} />
                </div>
              )}
            </div>

            <div>
              <Typography variant="h4" className="mt-6 mb-2">
                Session Period
              </Typography>
              <VotingTime className="hidden sm:block mt-4" loading={false} globalState={previewGlobalState} />
              <Box className="bg-green-light flex mt-4 rounded-xl px-4 py-6">
                <Stack>
                  <Typography>
                    <strong>Community Allocation: </strong>
                  </Typography>
                  <Typography>
                    {roundInfo.communityGrantAllocation ? roundInfo.communityGrantAllocation.microAlgos().algos.toLocaleString('en-US') : 0}{' '}
                    ALGO{roundInfo.communityGrantAllocation === 1 ? '' : 's'}
                  </Typography>
                  <Typography>{(roundInfo.communityGrantAllocation || 0).microAlgos().toString()} </Typography>
                </Stack>
              </Box>
              <Alert className="max-w-xl mt-8 bg-algorand-warning font-semibold" icon={false}>
                Review everything on this page carefully, as it cannot be changed once you create the voting round!
              </Alert>
              <div className="mt-8 flex gap-6 justify-end max-w-xl">
                <Button variant="outlined" onClick={() => navigate(-1)}>
                  Back
                </Button>
                <Button variant="contained" onClick={() => setConfirmationDialogOpen(true)}>
                  Create voting round
                </Button>
              </div>
            </div>
          </div>
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
            setConfirmationDialogOpen(false)
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
          title="Processing - please check your wallet for any pending transactions"
          note="It can take up to 30 seconds to progress once you sign each transaction."
        />
      </div>
    </>
  )
}
