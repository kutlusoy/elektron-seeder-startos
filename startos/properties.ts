import { sdk } from './sdk'

export const properties = sdk.setupProperties(async ({ effects }) => {
  const cfg = await sdk.store.getOwn(effects, sdk.StorePath.config).const()

  if (!cfg) {
    return {
      Status: {
        type: 'string',
        value: 'Not configured yet',
        description: 'Open the Config action to set DNS host + nameserver.',
        copyable: false,
        qr: false,
      },
    }
  }

  return {
    'DNS Host': {
      type: 'string',
      value: cfg.host,
      description: 'FQDN this seeder answers DNS queries for',
      copyable: true,
      qr: false,
    },
    Nameserver: {
      type: 'string',
      value: cfg.nameserver,
      description: 'Host of this seeder, used as SOA NS',
      copyable: true,
      qr: false,
    },
    Network: {
      type: 'string',
      value: cfg.testnet ? 'testnet' : 'mainnet',
      description: 'Which Elektron Net the crawler is targeting',
      copyable: false,
      qr: false,
    },
    'DNS Port': {
      type: 'string',
      value: String(cfg['dns-port']),
      description: 'UDP port served by the seeder',
      copyable: false,
      qr: false,
    },
    'Tor Proxy': {
      type: 'string',
      value: cfg['tor-proxy'] || '(none)',
      description: 'SOCKS5 proxy used to dial .onion peers',
      copyable: false,
      qr: false,
    },
  }
})
