import { VotingRoundMetadata } from '@/shared/IPFSGateway'
import { TallyCounts } from '@/shared/VotingRoundContract'

export interface TotalAskedAndAwarded {
  totalAwarded: number
  totalAsked: number
}

export function calculateTotalAskedAndAwarded(
  votingRoundResults: TallyCounts | undefined,
  votingRoundMetadata: VotingRoundMetadata | undefined,
): TotalAskedAndAwarded {
  const optionIdsToCounts = {} as {
    [optionId: string]: number
  }

  votingRoundResults?.forEach((result) => {
    optionIdsToCounts[result.optionId] = result.count
  })

  let totalAwarded = 0
  let totalAsked = 0

  //Filtering out a specific misconfigured mock proposal
  const filteredQuestions = votingRoundMetadata?.questions.filter((question) => !question.prompt.toLowerCase().includes('mock proposal'))

  filteredQuestions?.forEach((question) => {
    totalAsked += question.metadata?.ask || 0
    question.options.forEach((option) => {
      if (question.metadata && question.metadata.threshold && optionIdsToCounts[option.id] > question.metadata.threshold) {
        totalAwarded += question.metadata?.ask || 0
      }
    })
  })

  return { totalAwarded, totalAsked }
}
