import { sdk } from '../sdk'

export const showStats = sdk.Action.withoutInput(
  'show-stats',
  async () => ({
    name: 'Show Stats',
    description:
      'Display a snapshot of the latest crawl statistics from dnsseed.dump (top entries by quality).',
    warning: null,
    allowedStatuses: 'only-running',
    group: 'monitoring',
    visibility: 'enabled',
  }),
  async ({ effects }) => {
    const mounts = sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: '/data',
      readonly: true,
    })

    const out = await SubContainerHelper(effects, mounts)

    return {
      version: '1' as const,
      title: 'Crawler Stats',
      message: out.slice(0, 65000),
      result: null,
    }
  },
)

async function SubContainerHelper(
  effects: Parameters<typeof sdk.SubContainer.of>[0],
  mounts: ReturnType<typeof sdk.Mounts.of>,
): Promise<string> {
  const container = await sdk.SubContainer.of(
    effects,
    { imageId: 'main' },
    mounts,
    'show-stats',
  )
  try {
    const script = `
if [ ! -f /data/seeder/dnsseed.dump ]; then
  echo "No dnsseed.dump yet - give the crawler a few minutes to build its database."
  exit 0
fi

DATA=$(tail -n +2 /data/seeder/dnsseed.dump | sort -k3 -rn | head -n 20)
TOTAL=$(tail -n +2 /data/seeder/dnsseed.dump | wc -l | tr -d ' ')
GOOD=$(tail -n +2 /data/seeder/dnsseed.dump | awk '$2==1' | wc -l | tr -d ' ')

echo "Elektron Net Seeder - Crawler Stats"
echo "Nodes in database : $TOTAL   |   Good nodes: $GOOD"
echo "Showing           : top 20 by most recent contact"
echo ""
printf "%-45s  %-5s  %-8s  %6s  %6s  %6s  %6s  %6s  %7s  %8s  %5s  %s\n" \
  "Address" "Good" "Last OK" "2h%" "8h%" "1d%" "7d%" "30d%" "Blocks" "Svcs" "Proto" "Version"
printf '%.0s-' $(seq 1 130)
echo ""

echo "$DATA" | while IFS= read -r line; do
  addr=\$(echo "\$line"  | awk '{print \$1}')
  good=\$(echo "\$line"  | awk '{print \$2}')
  last=\$(echo "\$line"  | awk '{print \$3}')
  p2h=\$( echo "\$line"  | awk '{print \$4}')
  p8h=\$( echo "\$line"  | awk '{print \$5}')
  p1d=\$( echo "\$line"  | awk '{print \$6}')
  p7d=\$( echo "\$line"  | awk '{print \$7}')
  p30d=\$(echo "\$line"  | awk '{print \$8}')
  blk=\$( echo "\$line"  | awk '{print \$9}')
  svcs=\$(echo "\$line"  | awk '{print \$10}')
  proto=\$(echo "\$line" | awk '{print \$11}')
  ver=\$( echo "\$line"  | awk '{for(i=12;i<=NF;i++) printf "%s ", \$i; print ""}' | sed 's/ \$//')

  now=\$(date +%s)
  age=\$((now - last))
  if [ \$age -lt 60 ]; then ago="\${age}s ago"
  elif [ \$age -lt 3600 ]; then ago="\$((age/60))m ago"
  elif [ \$age -lt 86400 ]; then ago="\$((age/3600))h ago"
  else ago="\$((age/86400))d ago"
  fi

  if [ "\$good" = "1" ]; then goodstr="YES"; else goodstr="no"; fi

  printf "%-45s  %-5s  %-8s  %6s  %6s  %6s  %6s  %6s  %7s  %8s  %5s  %s\n" \
    "\$addr" "\$goodstr" "\$ago" "\$p2h" "\$p8h" "\$p1d" "\$p7d" "\$p30d" "\$blk" "\$svcs" "\$proto" "\$ver"
done
`
    const r = await container.exec(['sh', '-c', script])
    return (r.stdout?.toString() || 'no output')
  } finally {
    await container.destroy()
  }
}
