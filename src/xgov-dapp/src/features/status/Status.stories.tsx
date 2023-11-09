import StatusPage from './index'
import { withRoute } from '../../stories/withRoute'
export default {
  title: 'Pages',
  render: withRoute(() => <StatusPage />, { wallet: 'TWI4TQQGI2BWT4CDCGZJCNHDYAJE5OLFBMFKXEG3OBWFOLIPGJCY6HAHKA', layout: true }),
}

export const Status = {}
