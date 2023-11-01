import StatusPage from './index'
import { withStorybookWrapper } from '../../stories/withRoute'
export default {
  title: 'Pages',
  render: withStorybookWrapper(() => <StatusPage />, {
    wallet: { enabled: true, address: 'TWI4TQQGI2BWT4CDCGZJCNHDYAJE5OLFBMFKXEG3OBWFOLIPGJCY6HAHKA' },
    appShell: true,
  }),
}

export const Status = {}
