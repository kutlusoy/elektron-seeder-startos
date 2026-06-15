import { sdk } from './sdk'

/**
 * Dependency declarations. The seeder has no hard dependencies; any Tor usage
 * is left to the user to wire up (this slot is preserved for the SDK 1.5+ API).
 */
export const setDependencies = sdk.setupDependencies(
  async ({ effects: _effects }) => ({}),
)
