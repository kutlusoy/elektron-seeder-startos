import { StartSdk } from '@start9labs/start-sdk'

export const sdk = StartSdk.of()
  .withManifest()
  .withStore<{
    config: {
      host: string
      nameserver: string
      mbox: string | null
      'dns-port': number
      'bind-ip': string
      threads: number
      'dns-threads': number
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
    oneShot: {
      'wipe-ban': boolean
      'wipe-ignore': boolean
      'reset-db': boolean
    }
  }>()
  .build(true)
