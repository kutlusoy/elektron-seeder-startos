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

## DynDNS Updater (optional)

If your StartOS does not have a static public IP — typical home installations behind a FritzBox, cable router, or any consumer ISP — the **Nameserver** record needs to follow your changing WAN address. You have two options:

1. **Let your router do it** (recommended when possible). A FritzBox can speak DynDNS natively under *Internet → Permit Access → DynDNS*. In that case leave the built-in updater **disabled**.
2. **Let StartOS do it.** Enable the built-in updater below. The service then periodically contacts your DynDNS provider with the public IP it sees from StartOS itself.

To use the built-in updater, expand **DynDNS Updater** in the Config action and set:

- **Enable DynDNS updater** — turn this on
- **IPv4 update URL** — the full HTTP(S) endpoint your DynDNS provider expects. Use the placeholder `<ipv4>` (alias `<ipaddr>`) where the detected public IPv4 should be inserted. Leave empty to skip v4 updates.
- **IPv6 update URL** — same idea for IPv6. Placeholder: `<ipv6>` (alias `<ip6addr>`). Leave empty to skip v6 updates.
- **Update interval (minutes)** — how often the updater runs. Default `5`, minimum `1`. Free providers usually accept anything ≥ 5 min.

IPv4 and IPv6 are **completely independent**: you can enable only one of them, both, or use different providers for each.

### Provider examples

**dynv6.com** — free, supports v4 + v6:

- IPv4 URL: `https://dynv6.com/api/update?hostname=seed.example.com&token=YOUR_HTTP_TOKEN&ipv4=<ipv4>`
- IPv6 URL: `https://dynv6.com/api/update?hostname=seed.example.com&token=YOUR_HTTP_TOKEN&ipv6=<ipv6>`

(Get the HTTP Token from dynv6 → *My Account → Keys & Tokens*.)

**DuckDNS** — free, IPv4 only:

- IPv4 URL: `https://www.duckdns.org/update?domains=my-seeder&token=YOUR_TOKEN&ip=<ipv4>`

**No-IP** — free tier needs renewal every 30 days:

- IPv4 URL: `https://USERNAME:PASSWORD@dynupdate.no-ip.com/nic/update?hostname=seed.example.com&myip=<ipv4>`

### How public IPs are detected

The updater queries `api.ipify.org` (falling back to `icanhazip.com`) over IPv4 and IPv6 separately. If your StartOS has no working IPv6 path, the v6 update is skipped silently — it does not crash the service.

### Verifying

After the first interval, run from another machine:

```
nslookup seed.example.com
```

The answer should equal the IP shown by `curl ifconfig.me` on your home network. Container logs of the service show one `[dyndns] updating IPv4 -> …` line per tick and surface any errors returned by the provider.

> Note on placeholders: `<ip6lanprefix>` (a FritzBox-specific value) is **not** available on StartOS and will be replaced with the empty string. Use only `<ipv4>`/`<ipv6>` in your URLs.

## Verifying the seeder

After the service has been running for a while, query it directly:

```
dig @<your-ip> seed.example.com
```

A populated answer section means the seeder is healthy and has discovered peers.

## Tips

- Give it 6–24h to fill its peer database before relying on it.
- Inspect `dnsseed.dump` inside the service data volume to see the tracked nodes.
- Run two independent seeders on separate networks for redundancy.
