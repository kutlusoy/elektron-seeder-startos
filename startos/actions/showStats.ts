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
    const mounts = sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: '/data',
      readonly: true,
    })

    const out = await SubContainerHelper(effects, mounts)

    return {
      version: '1' as const,
      title: 'Crawler Stats',
      message: out.slice(0, 65000),
      result: null,
    }
  },
)

async function SubContainerHelper(
  effects: Parameters<typeof sdk.SubContainer.of>[0],
  mounts: ReturnType<typeof sdk.Mounts.of>,
): Promise<string> {
  const container = await sdk.SubContainer.of(
    effects,
    { imageId: 'main' },
    mounts,
    'show-stats',
  )
  try {
    const r = await container.exec([
      'sh',
      '-c',
      'test -f /data/seeder/dnsseed.dump && head -n 50 /data/seeder/dnsseed.dump || echo "No dnsseed.dump yet. Give the crawler some time to build its database."',
    ])
    return (r.stdout?.toString() || 'no output')
  } finally {
    await container.destroy()
  }
}
