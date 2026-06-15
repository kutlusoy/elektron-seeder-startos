import { sdk } from './sdk'

/**
 * Soft dependency on a Tor service. The seeder only *needs* Tor if the user
 * has configured a tor-proxy or supplied .onion seeds; this hook simply
 * surfaces that relationship in the StartOS UI without enforcing it.
 */
export const dependencies = sdk.setupDependencies(async ({ effects }) => {
  const cfg = await sdk.store.getOwn(effects, sdk.StorePath.config).const()
  const usesTor =
    !!cfg?.['tor-proxy'] ||
    (cfg?.['extra-seeds'] || []).some((s) => s.endsWith('.onion'))

  if (!usesTor) return {}

  return {
    tor: {
      kind: 'running',
      versionRange: '*',
      healthChecks: [],
    },
  }
})
