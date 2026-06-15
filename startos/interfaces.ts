import { sdk } from './sdk'
import { configFile } from './fileModels/config'

/**
 * Service binding for the DNS server. Exposed via the SDK 1.5 MultiHost /
 * createInterface API.
 */
export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const cfg = await configFile.read().const(effects)
  const port = cfg?.['dns-port'] ?? 53

  const dnsMulti = sdk.MultiHost.of(effects, 'dns-multi')
  const dnsOrigin = await dnsMulti.bindPort(port, {
    protocol: 'dns',
    preferredExternalPort: port,
  })

  const dns = sdk.createInterface(effects, {
    id: 'dns',
    name: 'DNS Server',
    description: 'Public DNS endpoint of the Elektron seeder.',
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  const dnsReceipt = await dnsOrigin.export([dns])

  return [dnsReceipt]
})
