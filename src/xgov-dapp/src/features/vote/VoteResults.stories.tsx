import { withRoute } from '../../stories/withRoute'
import { VoteResults as Component, VoteResultsProps } from './VoteResults'

export default {
  title: 'Pages',
  render: withRoute((props: VoteResultsProps) => <Component {...props} />, { layout: true }),
}

export const VoteResult = {
  args: {
    votingRoundResults: [
      {
        optionId: 'adaaf940-3405-4a72-80b8-bd63e8ef99f6',
        count: 0,
      },
      {
        optionId: '739dfe56-a7fb-402a-8436-0f69f3620926',
        count: 2,
      },
    ],
    votingRoundMetadata: {
      id: 'V1HCDQKDVF',
      type: 3,
      title: 'Test',
      start: '2023-10-01T05:00:00.000Z',
      end: '2023-10-31T05:00:00.000Z',
      voteGatingSnapshotCid: 'bafkreiadhnmyegc6x6dn5d37gihtfnpxdumcuenhis4k6trd3zhfdgoruq',
      questions: [
        {
          id: '6b6af6c2-7bd2-4b78-a0ef-65635a8b70cc',
          prompt: 'xGov Handoff',
          description: 'Handing off xGov',
          options: [
            {
              id: 'adaaf940-3405-4a72-80b8-bd63e8ef99f6',
              label: 'yes',
            },
          ],
          metadata: {
            link: 'http://linkforfrontend/',
            category: 'Test',
            focus_area: 'Onboarding',
            threshold: 20000,
            ask: 200,
          },
        },
        {
          id: 'c24c409e-b190-40d1-be04-cf1011c69f7d',
          prompt: 'xGov Refactor',
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus blandit sit amet leo sit amet volutpat. Donec commodo mattis turpis et suscipit. Sed tortor magna, vestibulum sit amet dignissim eget, egestas at diam. Cras feugiat risus sit amet turpis dignissim feugiat. Nullam eu justo in neque iaculis gravida. Curabitur et nisi at mauris ullamcorper venenatis nec varius risus. Mauris eu arcu ut eros ultricies imperdiet. Quisque interdum, lorem rutrum euismod sagittis, ex lectus tincidunt justo, vitae pretium sapien neque a dui.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. In vestibulum id leo vestibulum placerat. In fringilla purus eros, pulvinar interdum lorem rutrum id. Duis pharetra erat a risus semper, eget auctor nibh laoreet. Phasellus metus lectus, volutpat non pellentesque a, fermentum sed mi. Pellentesque lacus augue, bibendum vel mi sed, gravida rutrum est. Vivamus sit amet dignissim purus. Fusce sodales orci sed metus feugiat, ac placerat enim porta. Quisque lacus neque, elementum a diam sit amet, molestie pellentesque lacus. Vestibulum condimentum velit in viverra volutpat. Sed porta euismod hendrerit. Etiam sollicitudin semper ornare. Donec nec ex facilisis, imperdiet risus vitae, vestibulum nulla.',
          options: [
            {
              id: '739dfe56-a7fb-402a-8436-0f69f3620926',
              label: 'yes',
            },
          ],
          metadata: {
            link: 'http://linkforfrontend/',
            category: 'Another',
            focus_area: 'Other',
            threshold: 20000,
            ask: 10,
          },
        },
      ],
      created: {
        at: '2023-10-10T22:17:02.191Z',
        by: 'BQWUKQDMCLRGSPVFOUK3M6NUTXNYCDL4KKHZZ464K2O7IC4GHVLAUKKETM',
      },
    },
    votingRoundGlobalState: {
      appId: 1001,
      start_time: '2023-10-01T05:00:00.000Z',
      end_time: '2023-10-31T05:00:00.000Z',
      quorum: 0,
      close_time: '2023-10-10T22:17:34.000Z',
      metadata_ipfs_cid: 'bafkreifqeribssjyyt2zhyprqiswbbupzijbi5kcbulhs7rpcc7i4yqti4',
      is_bootstrapped: true,
      nft_image_url: 'ipfs://bafkreiguj3svliomqnqpy2bvrlz5ud24girftynx2ywsugy7sr73zqnujy',
      nft_asset_id: 1041,
      voter_count: 1,
      total_options: 2,
      option_counts: [1, 1],
      opUpAppId: 1004,
      vote_type: 3,
    },
    isLoadingVotingRoundData: false,
    isLoadingVotingRoundResults: false,
    snapshot: {
      title: 'Test',
      publicKey: 'imlYnm+1xYXKOY1tmrveXgmMiTXCzp2hnATFybWVXTc=',
      snapshot: [
        {
          address: 'BQWUKQDMCLRGSPVFOUK3M6NUTXNYCDL4KKHZZ464K2O7IC4GHVLAUKKETM',
          signature: 'kLk47MFgEDPOxP3u93gZGTgFkgfwMBJ7lNk4qsm/H+J7zmBGGXUyr1TIRi+WY7GcIM8PAKv2ETsuWiQrFJgsBg==',
          weight: 2,
        },
      ],
      created: {
        at: '2023-10-10T22:17:02.145Z',
        by: 'BQWUKQDMCLRGSPVFOUK3M6NUTXNYCDL4KKHZZ464K2O7IC4GHVLAUKKETM',
      },
    },
  },
}
