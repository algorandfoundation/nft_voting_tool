import VoteCreationReviewPage from './index'

import Root from '../../../stories/Root'
import { withRoute } from '../../../stories/withRoute'
export default {
  title: 'Admin',
  render: withRoute(() => <VoteCreationReviewPage />, { layout: true }),
}

export const CreateRoundReview = {}
