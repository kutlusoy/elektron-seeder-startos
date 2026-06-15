import { sdk } from './sdk'

/**
 * Schema migrations between package versions. Add a `from<old>To<new>` entry
 * whenever the on-disk layout or the store shape changes.
 */
export const migrations = sdk.setupMigrations({
  current: {
    version: '0.1.0',
    up: async () => {},
    down: async () => {
      throw new Error('downgrades are not supported')
    },
  },
  other: {},
})
