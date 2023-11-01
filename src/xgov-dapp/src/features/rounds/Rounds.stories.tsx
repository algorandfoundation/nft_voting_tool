import { VotingRounds, VotingRoundsProps } from './VotingRounds'
import { DEFAULT_OPTIONS, withStorybookWrapper } from '../../stories/withRoute'
import { OPEN_ROUNDS } from '../../stories/VotingRounds'

export default {
  title: 'Features/Round',
  parameters: {
    actions: {
      handles: ['click .MuiButton-root', 'click a', 'click button', 'click svg'],
    },
  },
  argTypes: {
    rounds: {
      options: ['Empty', 'Open'],
      mapping: {
        Empty: {
          open: [],
          closed: [],
          upcoming: [],
        },
        Open: {
          open: OPEN_ROUNDS,
          closed: [],
          upcoming: [],
        },
      },
      table: {
        defaultValue: 'Empty',
      },
    },
  },
  args: {
    isLoading: false,
    isError: false,
    error: 'Something went wrong, try unplugging and plugging it back in!',
    rounds: {
      open: [],
      closed: [],
      upcoming: [],
    },
  },
  component: withStorybookWrapper<VotingRoundsProps>(
    (args) => {
      let error
      if (typeof args.error === 'string') {
        error = {
          message: args.error,
        }
      }
      return <VotingRounds {...args} error={error} />
    },
    { appShell: true, wallet: { enabled: false } },
  ),
}

export const Public = {}

export const Admin = {
  args: {
    activeAddress: DEFAULT_OPTIONS.wallet.address,
    creators: [DEFAULT_OPTIONS.wallet.address],
  },
}
