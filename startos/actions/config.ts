import { sdk } from '../sdk'
import { inputSpec } from '../inputSpec'

export const setConfig = sdk.Action.withInput(
  'config',
  async ({ effects }) => ({
    name: 'Configure',
    description: 'Configure the Elektron Seeder.',
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  async ({ effects }) => inputSpec,
  async ({ effects }) => sdk.store.getOwn(effects, sdk.StorePath.config).const(),
  async ({ effects, input }) => {
    await sdk.store.setOwn(effects, sdk.StorePath.config, input)
  },
)
