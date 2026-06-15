import { sdk } from './sdk'

export const manifest = sdk.Manifest.of({
  id: 'elektron-seeder',
  title: 'Elektron Seeder',
  license: 'mit',
  wrapperRepo: 'https://github.com/kutlusoy/elektron-seeder-startos',
  upstreamRepo: 'https://github.com/kutlusoy/elektron-net-seeder',
  supportSite: 'https://github.com/kutlusoy/elektron-net-seeder/issues',
  marketingSite: 'https://elektron-net.org',
  donationUrl: null,
  description: {
    short: 'A crawler for the Elektron Net',
    long: 'Elektron Net Seeder is a crawler for the Elektron Net, which exposes a list of reliable nodes via a built-in DNS server.\n\nFeatures:\n* regularly revisits known nodes to check their availability\n* bans nodes after enough failures, or bad behaviour\n* accepts nodes down to v0.3.19 to request new IP addresses from, but only reports good post-v0.3.24 nodes.\n* keeps statistics over (exponential) windows of 2 hours, 8 hours, 1 day and 1 week, to base decisions on.\n* very low memory (a few tens of megabytes) and cpu requirements.\n* crawlers run in parallel (by default 24 threads simultaneously).',
  },
  assets: {
    license: 'LICENSE',
    icon: 'assets/icon.svg',
    instructions: 'instructions.md',
  },
  volumes: ['main'],
  images: {
    main: {
      source: {
        dockerBuild: {
          dockerfile: 'Dockerfile',
          workdir: '.',
        },
      },
      arch: ['x86_64', 'aarch64'],
      emulateMissingAs: 'aarch64',
    },
  },
  hardwareRequirements: {},
  alerts: {
    install:
      'Elektron Seeder needs an authoritative NS record pointing to your StartOS public IP before it can serve DNS queries. See the instructions page for details.',
    update: null,
    uninstall:
      'Uninstalling will permanently remove the crawler database (dnsseed.dat) and the ban / ignore lists. Take a backup first if you want to preserve them.',
    restore: null,
    start: null,
    stop: null,
  },
  dependencies: {},
})
