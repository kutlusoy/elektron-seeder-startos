import { sdk } from '../sdk'
import { oneShotFile } from '../fileModels/oneShot'

export const wipeBanOnce = sdk.Action.withoutInput(
  'wipe-ban-once',
  async () => ({
    name: 'Wipe Ban List (one shot)',
    description:
      'Clear the seeder ban list on the next service start. Auto-resets after the next start so it does not run every restart.',
    warning:
      'This unbans every previously banned peer. Make sure that is what you want.',
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
    await oneShotFile.write(effects, { ...cur, 'wipe-ban': true })
  },
)
