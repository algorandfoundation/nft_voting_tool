import { Question } from './question'

export interface Vote {
  title: string
  informationUrl: string
  description: string
  start: Date
  end: Date
  quorum?: number
  snapshotIpfs?: string
  questions: Question[]
}
