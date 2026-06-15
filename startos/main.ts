import { sdk } from './sdk'
import * as yaml from 'yaml'

export const main = sdk.setupMain(async ({ effects, started }) => {
  const cfg = await sdk.store.getOwn(effects, sdk.StorePath.config).const()
  if (!cfg || !cfg.host || !cfg.nameserver) {
    throw new Error(
      'Elektron Seeder is not configured. Open the service Config action and set at least DNS Host and Nameserver before starting.',
    )
  }

  await sdk.SubContainer.with(
    effects,
    { imageId: 'main' },
    [
      {
        type: 'volume',
        id: 'main',
        subpath: null,
        mountpoint: '/data',
        readonly: false,
      },
    ],
    'main',
    async (container) => {
      await container.exec(['mkdir', '-p', '/data/start9'])
      await container.exec([
        'sh',
        '-c',
        `cat > /data/start9/config.yaml <<'EOF'\n${yaml.stringify(cfg)}\nEOF`,
      ])

      const daemon = await sdk.Daemons.of({
        effects,
        started,
        healthReceipts: [],
      }).addDaemon('primary', {
        subcontainer: container,
        command: ['/usr/local/bin/docker_entrypoint.sh'],
        mounts: sdk.Mounts.of().mountVolume({
          volumeId: 'main',
          subpath: null,
          mountpoint: '/data',
          readonly: false,
        }),
        ready: {
          display: 'DNS server',
          fn: async () => ({ result: 'success', message: 'dnsseed running' }),
        },
        requires: [],
      })

      return daemon
    },
  )
})
