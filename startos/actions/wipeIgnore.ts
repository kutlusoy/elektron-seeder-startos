import { sdk } from '../sdk'

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
    await sdk.store.setOwn(effects, sdk.StorePath.oneShot['wipe-ignore'], true)
  },
)
