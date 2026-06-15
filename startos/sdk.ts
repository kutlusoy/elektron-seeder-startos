import { StartSdk } from '@start9labs/start-sdk'

export const sdk = StartSdk.of()
  .withManifest()
  .withStore<{
    config: {
      host: string
      nameserver: string
      mbox: string | null
      'dns-port': number
      threads: number
      'dns-threads': number
      'bind-ip': string
      testnet: boolean
      'p2p-port': number | null
      magic: string | null
      'min-height': number | null
      'extra-seeds': string[]
      'tor-proxy': string | null
      'ipv4-proxy': string | null
      'ipv6-proxy': string | null
      'service-filter': string[]
      'wipe-ban': boolean
      'wipe-ignore': boolean
    }
  }>()
  .build(true)
