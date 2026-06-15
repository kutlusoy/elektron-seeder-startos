import { sdk } from './sdk'

/**
 * Service binding for the DNS server. Exposed as a raw UDP/TCP port that can
 * be opened externally so the wider internet can issue DNS queries to the
 * seeder.
 */
export const setInterfaces = sdk.setupInterfaces(
  async ({ effects, server }) => {
    const cfg = await sdk.store.getOwn(effects, sdk.StorePath.config).const()
    const port = cfg?.['dns-port'] ?? 53

    const dnsUdp = await sdk.bind(effects, {
      kind: 'udp',
      id: 'dns-udp',
      internalPort: port,
      preferredExternalPort: port,
      addSsl: null,
    })

    const dnsTcp = await sdk.bind(effects, {
      kind: 'tcp',
      id: 'dns-tcp',
      internalPort: port,
      preferredExternalPort: port,
      addSsl: null,
    })

    return [
      sdk.ServiceInterface.of({
        id: 'dns',
        name: 'DNS Server',
        description: 'Public DNS endpoint of the Elektron seeder.',
        type: 'api',
        masked: false,
        schemeOverride: null,
        bindings: [dnsUdp, dnsTcp],
      }),
    ]
  },
)
