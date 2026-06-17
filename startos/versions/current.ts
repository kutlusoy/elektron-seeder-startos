import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.1.1:22',
  releaseNotes: 'Initial release.',
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
