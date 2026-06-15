import { sdk } from './sdk'
import { manifest } from './manifest'
import { actions } from './actions'
import { main } from './main'

export const { packageInit, packageUninit, containerInit } =
  sdk.setupPackageInits(
    sdk.setupInit(
      manifest,
      async () => undefined, // install
      async () => undefined, // uninstall
      async () => undefined, // restore
      async () => undefined, // backup
      actions,
    ),
  )

export const { main: mainExport } = sdk.setupExports({ main })
