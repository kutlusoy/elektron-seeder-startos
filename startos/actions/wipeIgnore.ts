import { sdk } from '../sdk'
import { oneShotFile } from '../fileModels/oneShot'

export const wipeIgnoreOnce = sdk.Action.withoutInput(
  'wipe-ignore-once',
  async () => ({
    name: 'Wipe Ignore List (one shot)',
    description:
      'Clear the seeder ignore list on the next service start. Auto-resets after the next start.',
    warning: null,
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
    await oneShotFile.write(effects, { ...cur, 'wipe-ignore': true })
  },
)
