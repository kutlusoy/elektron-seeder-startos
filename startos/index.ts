import { sdk } from './sdk'
import { manifest } from './manifest'
import { actions } from './actions'
import { main } from './main'
import { properties } from './properties'
import { createBackup, restoreBackup } from './backups'
import { migrations } from './migrations'
import { dependencies } from './dependencies'

export const { packageInit, packageUninit, containerInit } =
  sdk.setupPackageInits(
    sdk.setupInit(
      manifest,
      async () => undefined, // install
      async () => undefined, // uninstall
      async () => undefined, // restore
      async () => undefined, // backup pre-hook
      actions,
    ),
  )

export const exports = sdk.setupExports({
  main,
  properties,
  createBackup,
  restoreBackup,
  migrations,
  dependencies,
})
