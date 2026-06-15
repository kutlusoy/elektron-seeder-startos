import { sdk } from '../sdk'
import { inputSpec } from '../inputSpec'
import { configFile } from '../fileModels/config'

export const setConfig = sdk.Action.withInput(
  'config',
  async ({ effects: _effects }) => ({
    name: 'Configure',
    description: 'Configure the Elektron Seeder.',
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  async ({ effects: _effects, prefill: _prefill }) => inputSpec,
  async ({ effects }) => (await configFile.read().const(effects)) ?? null,
  async ({ effects, input }) => {
    await configFile.write(effects, input)
  },
)
