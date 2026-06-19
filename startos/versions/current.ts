import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.1.2:26',
  releaseNotes: 'Updated stats.',
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
