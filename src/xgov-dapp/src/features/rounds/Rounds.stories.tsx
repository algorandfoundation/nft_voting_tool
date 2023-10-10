import VotingRoundsPage from './index'
import { withRoute } from '../../stories/withRoute'

export default {
  title: 'Pages',
  render: withRoute(() => <VotingRoundsPage />, { layout: true }),
}

export const Rounds = {}
