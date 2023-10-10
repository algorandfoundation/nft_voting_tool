import HeaderComponent from './siteHeader'
import { withRoute } from '../stories/withRoute'
import Root from '../stories/Root'
import { MemoryRouter } from 'react-router-dom'

export default {
  title: 'Components',
  render: () => (
    <MemoryRouter initialEntries={['/']}>
      <HeaderComponent />
    </MemoryRouter>
  ),
}

export const Header = {}
