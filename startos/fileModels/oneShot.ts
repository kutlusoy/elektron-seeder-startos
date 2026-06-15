import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

/**
 * One-shot maintenance toggles that are consumed (and cleared) by the next
 * service start. Backed by a JSON file inside the main volume.
 */
const shape = z.object({
  'wipe-ban': z.boolean(),
  'wipe-ignore': z.boolean(),
  'reset-db': z.boolean(),
})

export type OneShotData = z.infer<typeof shape>

export const oneShotFile = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'start9/oneShot.json' },
  shape,
)
