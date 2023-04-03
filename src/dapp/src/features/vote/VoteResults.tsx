import { Typography } from '@mui/material'
import { Fragment } from 'react'
import { Question } from '../../shared/IPFSGateway'
import { VotingRoundResult } from '../../shared/types'

type VoteResultsProps = {
  question: Question
  votingRoundResults: VotingRoundResult[]
}

export const VoteResults = ({ question, votingRoundResults }: VoteResultsProps) => {
  const counts = votingRoundResults.map((v) => v.count)
  const max = Math.max(...counts)
  const sum = counts.reduce((a, b) => a + b, 0)

  return (
    <>
      <div className="grid grid-cols-3 w-80 gap-2">
        {question.options.map((option) => {
          const result = votingRoundResults.find((result) => result.optionId === option.id)
          return (
            result && (
              <Fragment key={option.id}>
                <div className="col-span-2 h-10 flex items-center">
                  <div
                    className="bg-algorand-orange-coral h-10 rounded-tr-xl rounded-br-xl"
                    style={{ flexBasis: `${(result.count / max) * 150}px` }}
                  ></div>
                  <div className="p-2 pr-6">{result.count}</div>
                </div>
                <div className="flex  items-center">{option.label}</div>
              </Fragment>
            )
          )
        })}
      </div>
      <div className="flex mt-4">
        <Typography className="text-grey">Number of wallets voted</Typography>
        <Typography className="ml-4">{sum.toLocaleString()}</Typography>
      </div>
    </>
  )
}
