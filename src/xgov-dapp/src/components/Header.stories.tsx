import HeaderComponent from './siteHeader'
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
