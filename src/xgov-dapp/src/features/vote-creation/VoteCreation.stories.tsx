import VoteCreationPage from './RoundInfo'

import Root from '../../stories/Root'
import { withRoute } from '../../stories/withRoute'
export default {
  title: 'Admin',
  render: withRoute(() => <VoteCreationPage />, { layout: true }),
}

export const CreateRound = {}
