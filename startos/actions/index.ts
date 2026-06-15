import { sdk } from '../sdk'
import { setConfig } from './config'
import { wipeBanOnce } from './wipeBan'
import { wipeIgnoreOnce } from './wipeIgnore'
import { resetDb } from './resetDb'
import { showStats } from './showStats'

export const actions = sdk.Actions.of()
  .addAction(setConfig)
  .addAction(showStats)
  .addAction(wipeBanOnce)
  .addAction(wipeIgnoreOnce)
  .addAction(resetDb)
