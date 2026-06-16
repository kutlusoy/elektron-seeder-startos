import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

/**
 * Persistent user-supplied configuration for the Elektron Seeder.
 * Backed by a JSON file inside the main volume.
 */
const shape = z
  .object({
    host: z.string(),
    nameserver: z.string(),
    mbox: z.string().nullable(),
    'dns-port': z.number(),
    'bind-ip': z.string(),
    threads: z.number(),
    'dns-threads': z.number(),
    testnet: z.boolean(),
    'p2p-port': z.number().nullable(),
    magic: z.string().nullable(),
    'min-height': z.number().nullable(),
    'extra-seeds': z.array(z.string()),
    'tor-proxy': z.string().nullable(),
    'ipv4-proxy': z.string().nullable(),
    'ipv6-proxy': z.string().nullable(),
    'service-filter': z.array(z.string()),
    'wipe-ban': z.boolean(),
    'wipe-ignore': z.boolean(),
    dyndns: z
      .object({
        enabled: z.boolean(),
        'update-url-v4': z.string().nullable(),
        'update-url-v6': z.string().nullable(),
        'interval-minutes': z.number(),
      })
      .optional(),
  })
  .passthrough()

export type ConfigData = z.infer<typeof shape>

export const configFile = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'start9/config.json' },
  shape,
)
