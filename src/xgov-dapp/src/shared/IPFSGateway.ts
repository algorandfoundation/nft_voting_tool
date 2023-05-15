import { VoteType } from './types'

/** A discrete opportunity for vote casters to participate in a vote for a given context, this may consist of one or more questions */
export interface VotingRoundMetadata {
  id: string
  type: VoteType
  title: string
  description?: string
  /** Optional URL link to more information */
  informationUrl?: string
  /** Start of voting round as an ISO8601 string */
  start: string
  /** End of voting round as an ISO8601 string */
  end: string
  /** Optional quorum of participants for a valid result */
  quorum?: number
  /** The optional IPFS content ID of the vote gating snapshot used for this voting round */
  voteGatingSnapshotCid?: string
  /** The questions being voted on as part of the voting round */
  questions: Question[]
  created: CreatedMetadata
}

export interface Question {
  /** UUID of the question */
  id: string
  /** The question prompt text */
  prompt: string
  description?: string
  options: Option[]
  metadata: {
    link: string
    category: string
    focus_area: string
    threshold: number
    ask: number
  }
}

export interface Option {
  /** UUID of the option */
  id: string
  /** The text description of the option */
  label: string
}

export interface VoteGatingSnapshot {
  title: string
  /** Base 64 encoded public key corresponding to the ephemeral private key that was created to secure this snapshot */
  publicKey: string
  created: CreatedMetadata
  /** The snapshot of vote gates */
  snapshot: Gate[]
}

export interface Gate {
  /** Address of the account that is gated to vote */
  address: string
  /** The vote weighting of the account that is gated to vote */
  weight?: string
  /** Base 64 encoded signature of `{address}{weight(uint64)|string}` with the private key of this using ED25519 */
  signature: string
}

export interface CreatedMetadata {
  /** When the record was created, in ISO8601 format */
  at: string
  /** Account address of the creator */
  by: string
}

export interface Response {
  cid: string
}

const apiUrl = import.meta.env.VITE_IPFS_GATEWAY_URL

async function uploadFile(file: File, authSignature: { address: string; signedTransaction: Uint8Array }): Promise<Response> {
  const formData = new FormData()
  formData.append('file', file, file.name)

  const response = await fetch(apiUrl, {
    method: 'POST',
    body: formData,
    headers: {
      'X-ALGORAND-SIGNED-TXN': Buffer.from(authSignature.signedTransaction).toString('base64'),
      'X-ALGORAND-ADDRESS': authSignature.address,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`)
  }
  return (await response.json()) as Response
}

async function getData<T>(cid: string): Promise<T> {
  const response = await fetch(`${apiUrl}/${cid}`)
  if (!response.ok) {
    throw new Error(`Failed to get data: ${response.statusText}`)
  }
  const data = await response.json()
  return data as T
}

export async function fetchVotingRoundMetadata(cid: string): Promise<VotingRoundMetadata> {
  return await getData<VotingRoundMetadata>(cid)
}

export async function fetchVotingSnapshot(snapshotCid: string): Promise<VoteGatingSnapshot | undefined> {
  return await getData<VoteGatingSnapshot>(snapshotCid)
}

function generateFile(data: VotingRoundMetadata | VoteGatingSnapshot, fileName: string): File {
  const csvBlob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  return new File([csvBlob], fileName, { type: 'application/json' })
}

export async function uploadVoteGatingSnapshot(
  voteGatingSnapshot: VoteGatingSnapshot,
  authSignature: { address: string; signedTransaction: Uint8Array },
): Promise<Response> {
  const voteGratingSnapshotFile = generateFile(voteGatingSnapshot, 'voteGatingSnapshot.json')
  return await uploadFile(voteGratingSnapshotFile, authSignature)
}

export async function uploadVotingRound(
  votingRound: VotingRoundMetadata,
  authSignature: { address: string; signedTransaction: Uint8Array },
): Promise<Response> {
  const votingRoundFile = generateFile(votingRound, 'votingRound.json')
  return await uploadFile(votingRoundFile, authSignature)
}
