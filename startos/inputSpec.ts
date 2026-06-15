import { sdk } from './sdk'
const { Value, List } = sdk

export const inputSpec = sdk.InputSpec.of({
  host: Value.text({
    name: 'DNS Host',
    description:
      'The fully-qualified domain name this seeder will answer queries for. Example: seed.elektron-net.org',
    required: true,
    default: null,
    placeholder: 'seed.elektron-net.org',
    patterns: [
      {
        regex: '^[A-Za-z0-9.-]+$',
        description: 'Must be a valid DNS host name',
      },
    ],
  }),
  nameserver: Value.text({
    name: 'Nameserver',
    description:
      'The host name of the machine running this seeder, used as the SOA NS record. Example: vps.elektron-net.org',
    required: true,
    default: null,
    placeholder: 'vps.elektron-net.org',
    patterns: [
      {
        regex: '^[A-Za-z0-9.-]+$',
        description: 'Must be a valid DNS host name',
      },
    ],
  }),
  mbox: Value.text({
    name: 'Contact Email',
    description:
      'Operator contact e-mail used in the SOA RNAME field (the @ is replaced with a dot). Example: ops@elektron-net.org',
    required: false,
    default: null,
    placeholder: 'ops@elektron-net.org',
  }),

  // ---- network bindings ----
  'dns-port': Value.number({
    name: 'DNS Listen Port',
    description:
      'UDP port for the built-in DNS server. Use 53 to serve queries directly, or a high port together with an iptables redirect.',
    required: true,
    default: 53,
    min: 1,
    max: 65535,
    integer: true,
  }),
  'bind-ip': Value.text({
    name: 'Bind Address',
    description:
      'IP address the DNS server binds to. Defaults to "::" (all IPv4 + IPv6 interfaces).',
    required: true,
    default: '::',
    placeholder: '::',
  }),
  threads: Value.number({
    name: 'Crawler Threads',
    description: 'Number of parallel threads crawling the P2P network.',
    required: true,
    default: 96,
    min: 1,
    max: 256,
    integer: true,
  }),
  'dns-threads': Value.number({
    name: 'DNS Threads',
    description: 'Number of parallel threads handling DNS requests.',
    required: true,
    default: 4,
    min: 1,
    max: 64,
    integer: true,
  }),

  // ---- network selection ----
  testnet: Value.toggle({
    name: 'Testnet Mode',
    description: 'Crawl the Elektron Net testnet instead of mainnet.',
    default: false,
  }),
  'p2p-port': Value.number({
    name: 'P2P Port Override',
    description:
      'Override the P2P port used to dial peers. Leave empty to use the network default (8333 mainnet / 18333 testnet).',
    required: false,
    default: null,
    min: 1,
    max: 65535,
    integer: true,
  }),
  magic: Value.text({
    name: 'Network Magic Override',
    description:
      'Override the 4-byte network magic as an 8-char hex string. Leave empty to use the compiled default (e1ec7a6e mainnet).',
    required: false,
    default: null,
    placeholder: 'e1ec7a6e',
    patterns: [
      {
        regex: '^[0-9a-fA-F]{8}$',
        description: 'Exactly 8 hexadecimal characters',
      },
    ],
  }),
  'min-height': Value.number({
    name: 'Minimum Block Height',
    description:
      'Only return peers that report at least this block height. Leave empty for the compiled default.',
    required: false,
    default: null,
    min: 0,
    max: 100000000,
    integer: true,
  }),

  // ---- bootstrap seeds ----
  'extra-seeds': Value.list(
    List.text(
      {
        name: 'Additional Seeds',
        description:
          'Extra bootstrap hosts. Plain DNS names or .onion addresses are accepted. .onion entries require the Tor proxy below to be configured.',
      },
      {
        patterns: [
          {
            regex: '^([A-Za-z0-9.-]+|[a-z2-7]{16}\\.onion|[a-z2-7]{56}\\.onion)$',
            description: 'DNS hostname or v2/v3 .onion address',
          },
        ],
      },
    ),
  ),

  // ---- proxies ----
  'tor-proxy': Value.text({
    name: 'Tor SOCKS5 Proxy (-o)',
    description:
      'host:port of a SOCKS5 proxy (typically Tor at 127.0.0.1:9050) used to dial .onion peers. Required to crawl onion seed servers.',
    required: false,
    default: null,
    placeholder: '127.0.0.1:9050',
  }),
  'ipv4-proxy': Value.text({
    name: 'IPv4 SOCKS5 Proxy (-i)',
    description:
      'Optional host:port SOCKS5 proxy for all outbound IPv4 connections.',
    required: false,
    default: null,
    placeholder: '127.0.0.1:9050',
  }),
  'ipv6-proxy': Value.text({
    name: 'IPv6 SOCKS5 Proxy (-k)',
    description:
      'Optional host:port SOCKS5 proxy for all outbound IPv6 connections.',
    required: false,
    default: null,
    placeholder: '127.0.0.1:9050',
  }),

  // ---- filtering ----
  'service-filter': Value.list(
    List.text(
      {
        name: 'Service Flag Whitelist (-w)',
        description:
          'Hex-encoded service flag combinations that peers must match to be served. Leave empty for the built-in default whitelist (NODE_NETWORK, NODE_NETWORK_LIMITED, witness/bloom/compact-filter/p2p-v2 variants).',
      },
      {
        patterns: [
          {
            regex: '^[0-9a-fA-Fx]+$',
            description: 'Hex value (optionally prefixed with 0x)',
          },
        ],
      },
    ),
  ),

  // ---- maintenance ----
  'wipe-ban': Value.toggle({
    name: 'Wipe Ban List on Start',
    description:
      'If enabled, clears the list of banned nodes on the next service start. Disable again afterwards or every restart will wipe the list.',
    default: false,
  }),
  'wipe-ignore': Value.toggle({
    name: 'Wipe Ignore List on Start',
    description:
      'If enabled, clears the list of ignored nodes on the next service start.',
    default: false,
  }),
})

export type InputSpec = typeof inputSpec.validator._TYPE
