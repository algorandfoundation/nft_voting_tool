import { Fragment } from 'react'
import { Question } from '../../shared/IPFSGateway'
import { VotingRoundResult } from '../../shared/types'

type VoteResultsProps = {
  question: Question
  votingRoundResults: VotingRoundResult[]
  myVotes?: string[]
}

export const VoteResults = ({ question, votingRoundResults, myVotes }: VoteResultsProps) => {
  const counts = question.options.map((option) => {
    return votingRoundResults.find((item) => item.optionId === option.id)?.count || 0
  })
  const max = Math.max(...counts)

  return (
    <div className="grid grid-cols-3 w-160 gap-2">
      {question.options.map((option) => {
        const result = votingRoundResults.find((result) => result.optionId === option.id)
        return (
          result && (
            <Fragment key={option.id}>
              <div className="col-span-2 h-10 flex items-center">
                <div
                  className="bg-algorand-orange-coral h-10 rounded-tr-xl rounded-br-xl min-w-[5px]"
                  style={{ flexBasis: `${max ? (result.count / max) * 80 : 0}%` }}
                ></div>
                <div className="p-2 pr-6">
                  {result.count}
                  {result.count === 0 && ' Votes'}
                </div>
              </div>
              <div className="flex  items-center">
                {option.label}
                {myVotes?.includes(option.id) && (
                  <span title="You voted for this option" className="ml-2">
                    ⭐
                  </span>
                )}
              </div>
            </Fragment>
          )
        )
      })}
    </div>
  )
}
