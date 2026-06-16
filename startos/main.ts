import { sdk } from './sdk'
import { configFile } from './fileModels/config'
import { oneShotFile } from './fileModels/oneShot'
import * as yaml from 'yaml'

export const main = sdk.setupMain(async ({ effects }) => {
  const cfg = await configFile.read().const(effects)
  if (!cfg || !cfg.host || !cfg.nameserver) {
    throw new Error(
      'Elektron Seeder is not configured. Open the service Config action and set at least DNS Host and Nameserver before starting.',
    )
  }

  // Merge persistent toggles with one-shot toggles (cleared after this run)
  const oneShot = (await oneShotFile.read().const(effects)) ?? {
    'wipe-ban': false,
    'wipe-ignore': false,
    'reset-db': false,
  }
  const effective = {
    ...cfg,
    'wipe-ban': cfg['wipe-ban'] || oneShot['wipe-ban'],
    'wipe-ignore': cfg['wipe-ignore'] || oneShot['wipe-ignore'],
  }

  const mounts = sdk.Mounts.of().mountVolume({
    volumeId: 'main',
    subpath: null,
    mountpoint: '/data',
    readonly: false,
  })

  const container = await sdk.SubContainer.of(
    effects,
    { imageId: 'main' },
    mounts,
    'main',
  )

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
  await oneShotFile.write(effects, {
    'wipe-ban': false,
    'wipe-ignore': false,
    'reset-db': false,
  })

  const primary = sdk.Daemons.of(effects).addDaemon('primary', {
    subcontainer: container,
    exec: { command: ['/usr/local/bin/docker_entrypoint.sh'] },
    ready: {
      display: 'dnsseed',
      fn: () =>
        container
          .exec(['pgrep', '-x', 'dnsseed'])
          .then((r) =>
            r.exitCode === 0
              ? {
                  result: 'success' as const,
                  message: 'dnsseed process is running',
                }
              : {
                  result: 'failure' as const,
                  message: 'dnsseed process is not running',
                },
          ),
    },
    requires: [],
  })

  // Optional DynDNS updater — runs as a sibling daemon in the same container.
  // No-op when the user has not enabled it in Config.
  if (cfg.dyndns?.enabled) {
    const dyndnsContainer = await sdk.SubContainer.of(
      effects,
      { imageId: 'main' },
      mounts,
      'dyndns',
    )
    return primary.addDaemon('dyndns', {
      subcontainer: dyndnsContainer,
      exec: { command: ['/usr/local/bin/dyndns_updater.sh'] },
      ready: {
        display: 'dyndns-updater',
        fn: () => ({
          result: 'success' as const,
          message: 'DynDNS updater loop running',
        }),
      },
      requires: [],
    })
  }

  return primary
})
