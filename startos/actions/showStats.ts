import { sdk } from '../sdk'

export const showStats = sdk.Action.withoutInput(
  'show-stats',
  async () => ({
    name: 'Show Stats',
    description:
      'Display a snapshot of the latest crawl statistics from dnsseed.dump (top entries by quality).',
    warning: null,
    allowedStatuses: 'only-running',
    group: 'monitoring',
    visibility: 'enabled',
  }),
  async ({ effects }) => {
    const out = await sdk.runCommand(effects, {
      imageId: 'main',
      command: [
        'sh',
        '-c',
        'test -f /data/seeder/dnsseed.dump && head -n 50 /data/seeder/dnsseed.dump || echo "No dnsseed.dump yet. Give the crawler some time to build its database."',
      ],
      mounts: [
        {
          type: 'volume',
          id: 'main',
          subpath: null,
          mountpoint: '/data',
          readonly: true,
        },
      ],
    })

    return {
      version: '1',
      title: 'Crawler Stats',
      message: (out.stdout?.toString() || 'no output').slice(0, 65000),
      value: null,
      copyable: false,
      qr: false,
    }
  },
)
