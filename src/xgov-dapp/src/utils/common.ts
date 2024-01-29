import { Question, VotingRoundMetadata } from '../../../dapp/src/shared/IPFSGateway'
import { calculateTotalAskedAndAwarded } from '../shared/stats'
import { VotingRoundResult } from '../shared/types'

export function transformToDynamicThresholds(
  votingRoundMetadata: VotingRoundMetadata,
  totalVotes: number,
  totalVotingPower: number,
): VotingRoundMetadata {
  const clone = structuredClone(votingRoundMetadata) as VotingRoundMetadata
  // change threshold to be out of total votes instead of total voting power
  // according to https://algorandfoundation.atlassian.net/browse/AF-73
  clone.questions.map((question) => {
    if (question.metadata) {
      question.metadata.threshold =
        question.metadata.threshold && totalVotes && totalVotingPower && totalVotingPower !== 0
          ? (question.metadata.threshold * totalVotes) / totalVotingPower
          : question.metadata.threshold
    }
    return question
  })
  return clone
}

export const passedPercentage = (q: Question, votesTally: number) => {
  if (!q.metadata || !q.metadata.threshold) {
    return 0
  }
  return Math.min(100, (votesTally / q.metadata.threshold) * 100)
}

export const isReserveList = (question: Question, votesTally: number) => {
  const percentage = passedPercentage(question, votesTally)
  return percentage < 100 && percentage >= 100 // TODO: make this configurable, currently deactivated
}

export const generateOptionIDsToCountsMapping = (votingRoundResults: VotingRoundResult[]) => {
  return Object.fromEntries(votingRoundResults.map((result) => [result.optionId, result.count]))
}

export const generateReserveList = (votingRoundMetadata: VotingRoundMetadata, optionIDsToCountsMapping: { [key: string]: number }) => {
  return votingRoundMetadata.questions
    .filter((question) =>
      question.options.length > 0 && optionIDsToCountsMapping[question.options[0].id]
        ? isReserveList(question, optionIDsToCountsMapping[question.options[0].id])
        : false,
    )
    .sort((a, b) => {
      // sort reserve list by success rate, descending
      const aPercentage = passedPercentage(a, optionIDsToCountsMapping[a.id])
      const bPercentage = passedPercentage(b, optionIDsToCountsMapping[b.id])
      return bPercentage - aPercentage
    })
}

export const generatePassedReserveList = (
  reserveList: Question[],
  votingRoundResults: VotingRoundResult[],
  votingRoundMetadata: VotingRoundMetadata,
) => {
  const passedReserveList: Set<string> = new Set()
  if (!votingRoundMetadata.communityGrantAllocation) {
    return passedReserveList
  }
  const { totalAwarded } = calculateTotalAskedAndAwarded(votingRoundResults, votingRoundMetadata)
  let awardsForReserveList = votingRoundMetadata.communityGrantAllocation - totalAwarded.algos().microAlgos
  for (const question of reserveList) {
    if (question.metadata && question.metadata.ask && awardsForReserveList >= question.metadata.ask.algos().microAlgos) {
      passedReserveList.add(question.id)
      awardsForReserveList -= question.metadata.ask.algos().microAlgos
    }
  }
  return passedReserveList
}
