# Elektron Seeder

A DNS seeder for the [Elektron Net](https://github.com/kutlusoy/elektron-net). It crawls the P2P network and answers DNS A/AAAA queries with the addresses of currently-reachable peers, so fresh Elektron Net clients can bootstrap.

## Before you start

The seeder is **useless without DNS delegation**. You must own a domain and create an authoritative `NS` record that delegates a sub-domain (e.g. `seed.example.com`) to a host (e.g. `vps.example.com`) whose `A`/`AAAA` records point to your StartOS public IP.

Example zone file fragment:

```
seed.example.com.   86400  IN  NS  vps.example.com.
vps.example.com.    86400  IN  A   203.0.113.10
```

## Configuration

Open the **Config** action and set at minimum:

- **DNS Host** — the sub-domain you delegated (e.g. `seed.example.com`)
- **Nameserver** — the host of this machine (e.g. `vps.example.com`)
- **Contact Email** — published in SOA RNAME

Optional tuning is documented inline in the Config form. You can:

- override the **network magic** and **P2P port** (e.g. for forks or staging networks)
- set a **minimum block height** so only well-synced peers are served
- add **additional bootstrap seeds** — plain DNS hosts *or* `.onion` addresses
- configure a **Tor SOCKS5 proxy** (`-o`, typically `127.0.0.1:9050`) so `.onion` seeds and peers can be reached
- configure separate **IPv4** and **IPv6 SOCKS5 proxies** (`-i` / `-k`) for transport-level egress filtering
- whitelist specific peer **service flags** (`-w`) — leave empty for the sane built-in default set (NODE_NETWORK, NODE_NETWORK_LIMITED, witness / bloom / compact-filter / p2p-v2 variants)
- one-shot **wipe the ban or ignore list** on the next start (toggle, then disable again)
- set the **bind address** (defaults to `::` — dual-stack)

## Port 53

The built-in DNS server listens on port 53 by default. If the bundled port is unavailable on your StartOS, set **DNS Listen Port** to a high value (e.g. `15353`) and redirect 53 → 15353 with your router or with iptables on the host.

## Verifying

After the service has been running for a while, query it directly:

```
dig @<your-ip> seed.example.com
```

A populated answer section means the seeder is healthy and has discovered peers.

## Tips

- Give it 6–24h to fill its peer database before relying on it.
- Inspect `dnsseed.dump` inside the service data volume to see the tracked nodes.
- Run two independent seeders on separate networks for redundancy.
