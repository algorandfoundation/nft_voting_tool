import VotePage from './index'
import React from 'react'
import { withRoute } from '../../stories/withRoute'

export default {
  title: 'Pages',
  render: withRoute(() => <VotePage sort="descending" />, {
    wallet: 'TWI4TQQGI2BWT4CDCGZJCNHDYAJE5OLFBMFKXEG3OBWFOLIPGJCY6HAHKA',
    path: '/vote/:voteId',
    entries: ['/vote/286064112'],
    layout: true,
  }),
}

export const Vote = {}
