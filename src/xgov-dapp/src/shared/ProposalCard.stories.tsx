import { ProposalCard as Card, ProposalCardProps } from './ProposalCard'

export default {
  title: 'Components',
  render: (args: ProposalCardProps) => (
    <div className="grid grid-cols-1 gap-4">
      <div>
        <Card {...args} />
      </div>
    </div>
  ),
}

export const ProposalCard = {
  args: {
    link: 'https://example.com',
    title: 'Amazing xGov Propsal',
    description: 'Really interesting idea that involved the Algorand blockchain',
    category: 'Tools',
    focus_area: 'User Onboarding',
    threshold: 800,
    ask: 1337,
    votesTally: 867,
    hasClosed: false,
  },
}
