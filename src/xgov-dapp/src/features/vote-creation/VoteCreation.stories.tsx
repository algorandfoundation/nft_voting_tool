import VoteCreationPage from './RoundInfo'

import { withRoute } from '../../stories/withRoute'
export default {
  title: 'Admin',
  render: withRoute(() => <VoteCreationPage />, { layout: true }),
}

export const CreateRound = {}
