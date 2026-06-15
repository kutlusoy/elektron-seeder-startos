import { sdk } from '../sdk'
import { oneShotFile } from '../fileModels/oneShot'

export const resetDb = sdk.Action.withoutInput(
  'reset-db',
  async () => ({
    name: 'Reset Crawler Database',
    description:
      'Deletes dnsseed.dat / dnsseed.dump and forces the seeder to rebuild its peer database from scratch on the next start.',
    warning:
      'This wipes ALL accumulated peer statistics. Expect 6-24h before the seeder is useful again.',
    allowedStatuses: 'any',
    group: 'maintenance',
    visibility: 'enabled',
  }),
  async ({ effects }) => {
    const cur = (await oneShotFile.read().const(effects)) ?? {
      'wipe-ban': false,
      'wipe-ignore': false,
      'reset-db': false,
    }
    await oneShotFile.write(effects, { ...cur, 'reset-db': true })
  },
)
