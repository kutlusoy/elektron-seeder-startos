import { sdk } from './sdk'

/**
 * Health checks shown next to the service in the StartOS UI. Each function is
 * called periodically; the result determines whether the service appears
 * healthy.
 */
export const healthChecks = {
  process: sdk.HealthCheck.of({
    id: 'process',
    name: 'Process Running',
    fn: async ({ effects }) => {
      const r = await sdk.runCommand(effects, {
        imageId: 'main',
        command: ['pgrep', '-x', 'dnsseed'],
        mounts: [],
      })
      return r.exitCode === 0
        ? { result: 'success', message: 'dnsseed process is running' }
        : { result: 'failure', message: 'dnsseed process is not running' }
    },
  }),

  database: sdk.HealthCheck.of({
    id: 'database',
    name: 'Crawler Database',
    fn: async ({ effects }) => {
      const r = await sdk.runCommand(effects, {
        imageId: 'main',
        command: ['sh', '-c', 'test -f /data/seeder/dnsseed.dat && echo ok || echo missing'],
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
      const ok = (r.stdout?.toString() || '').trim() === 'ok'
      return ok
        ? { result: 'success', message: 'dnsseed.dat present' }
        : {
            result: 'starting',
            message:
              'dnsseed.dat not written yet — crawler is still bootstrapping (can take several minutes on first run)',
          }
    },
  }),
}
