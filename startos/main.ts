import { sdk } from './sdk'
import { setInterfaces } from './interfaces'
import { healthChecks } from './healthChecks'
import * as yaml from 'yaml'

export const main = sdk.setupMain(async ({ effects, started }) => {
  const cfg = await sdk.store.getOwn(effects, sdk.StorePath.config).const()
  if (!cfg || !cfg.host || !cfg.nameserver) {
    throw new Error(
      'Elektron Seeder is not configured. Open the service Config action and set at least DNS Host and Nameserver before starting.',
    )
  }

  // Merge persistent toggles with one-shot toggles (cleared after this run)
  const oneShot = (await sdk.store.getOwn(effects, sdk.StorePath.oneShot).const()) || {
    'wipe-ban': false,
    'wipe-ignore': false,
    'reset-db': false,
  }
  const effective = {
    ...cfg,
    'wipe-ban': cfg['wipe-ban'] || oneShot['wipe-ban'],
    'wipe-ignore': cfg['wipe-ignore'] || oneShot['wipe-ignore'],
  }

  await setInterfaces(effects)

  return sdk.SubContainer.with(
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
      await container.exec(['mkdir', '-p', '/data/start9', '/data/seeder'])

      if (oneShot['reset-db']) {
        await container.exec([
          'sh',
          '-c',
          'rm -f /data/seeder/dnsseed.dat /data/seeder/dnsseed.dump',
        ])
      }

      await container.exec([
        'sh',
        '-c',
        `cat > /data/start9/config.yaml <<'EOF'\n${yaml.stringify(effective)}\nEOF`,
      ])

      // Clear one-shot flags so they don't re-trigger on next restart
      await sdk.store.setOwn(effects, sdk.StorePath.oneShot, {
        'wipe-ban': false,
        'wipe-ignore': false,
        'reset-db': false,
      })

      return sdk.Daemons.of({
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
          display: 'dnsseed',
          fn: () =>
            healthChecks.process.fn({ effects } as any).then((r) => ({
              result: r.result === 'success' ? 'success' : 'failure',
              message: r.message,
            })),
        },
        requires: [],
      })
    },
  )
})
