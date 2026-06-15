import { sdk } from './sdk'

/**
 * Backup the crawler database and ban/ignore lists. Restoring brings the
 * seeder back to where it was without re-crawling for a day.
 */
export const { createBackup, restoreBackup } = sdk.Backups.volumes('main')
  .pathsToExclude([])
  .build()
