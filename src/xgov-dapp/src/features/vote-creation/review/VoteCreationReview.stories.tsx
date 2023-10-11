import VoteCreationReviewPage from './index'

import { withRoute } from '../../../stories/withRoute'
export default {
  title: 'Admin',
  render: withRoute(() => <VoteCreationReviewPage />, { layout: true }),
}

export const CreateRoundReview = {}
