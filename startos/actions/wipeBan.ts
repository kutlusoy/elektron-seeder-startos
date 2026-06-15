import { sdk } from '../sdk'

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
    await sdk.store.setOwn(effects, sdk.StorePath.oneShot['wipe-ban'], true)
  },
)
