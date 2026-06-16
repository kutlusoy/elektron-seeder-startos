# elektron-seeder-startos

StartOS service wrapper for [elektron-net-seeder](https://github.com/kutlusoy/elektron-net-seeder) — a DNS seeder for the Elektron Net P2P network.

Elektron Seeder is a crawler for the Elektron Net that exposes a list of reliable peers via a built-in DNS server. It:

- regularly revisits known nodes to check availability
- bans nodes after enough failures or bad behaviour
- accepts older nodes for address discovery but only serves recent, well-behaved peers
- keeps rolling statistics over 2h, 8h, 1d and 1w windows
- runs many crawler threads in parallel with very low CPU / RAM use

---

## Beginner's Guide: Running the Seeder at Home with a FritzBox and DynDNS

This walkthrough is for users who run StartOS at home behind a FritzBox and don't have a static public IP. Goal: make `seed.your-domain.tld` resolvable to peer IPs that the seeder collects from the Elektron Net.

### What you need

- A FritzBox (any current FRITZ!OS, 7.20 or newer)
- A domain you control (e.g. `my-seeder.org`). Cheap options: Namecheap, INWX, Porkbun.
- A free DynDNS account. Recommended: **dynv6.com** (supports IPv4 + IPv6, free, simple update URL) or **DuckDNS** (very simple, IPv4 only).
- StartOS running on a machine in your LAN with Elektron Seeder installed.

### Step 1 — Register a DynDNS hostname

Example using **dynv6.com**:

1. Sign up at https://dynv6.com
2. Create a new zone, e.g. `vps.dynv6.net`. This will be the host that always points to your home IP.
3. Open **My Account → Keys & Tokens** and copy the **HTTP Token** (long random string).

### Step 2 — Configure DynDNS in the FritzBox

FRITZ!Box GUI: **Internet → Permit Access → DynDNS** tab. Enable it and fill in:

| FritzBox field | What to enter (dynv6 example) |
|---|---|
| Use DynDNS | enabled |
| DynDNS provider | **User-defined** (or "Benutzerdefiniert") |
| Update-URL | `https://dynv6.com/api/update?hostname=<domain>&ipv4=<ipaddr>&ipv6=<ip6addr>&token=<pass>` |
| Domainname | `vps.dynv6.net` (the hostname you created) |
| Username | anything (dynv6 ignores it — enter `none`) |
| Password | the **HTTP Token** from Step 1 |

For **DuckDNS** use instead:
- Update-URL: `https://www.duckdns.org/update?domains=<domain>&token=<pass>&ip=<ipaddr>`
- Domainname: `my-seeder` (the part before `.duckdns.org`)
- Username: `none`
- Password: your DuckDNS token

The FritzBox automatically replaces `<domain>`, `<ipaddr>`, `<ip6addr>`, `<pass>` with the right values. Click **Apply** — within seconds the DynDNS hostname resolves to your current public IP.

Verify on any device:

```
nslookup vps.dynv6.net
```

### Step 3 — Open UDP port 53 to your StartOS server

In the FritzBox: **Internet → Permit Access → Port Sharing → Add Device for Sharing**.

| Field | Value |
|---|---|
| Device | your StartOS machine |
| Application | New application |
| Name | `Elektron Seeder DNS` |
| Protocol | **UDP** |
| Port to device | `53` |
| External port | `53` (same) |

Save. The seeder is now reachable at `vps.dynv6.net:53/udp`.

> Note: Some ISPs (especially CGNAT customers — Vodafone Cable, mobile uplinks) do **not** give you a real public IPv4. Run `curl ifconfig.me` on the FritzBox guest network and compare with the WAN IP shown in the FritzBox overview. If they differ you are behind CGNAT and need either an IPv6-only setup or a small VPS with a public IP as a relay.

### Step 4 — Get a domain and create the NS delegation

At your domain registrar's DNS panel, create two records on `your-domain.tld`:

| Type | Name | Value | TTL |
|---|---|---|---|
| `CNAME` (or `A` / `AAAA`) | `vps` | `vps.dynv6.net` | 300 |
| `NS` | `seed` | `vps.your-domain.tld` | 86400 |

Effect: queries for `seed.your-domain.tld` are delegated to your home FritzBox's WAN IP, which forwards UDP 53 to your seeder.

### Step 5 — Configure the Elektron Seeder in StartOS

Open the **Elektron Seeder → Config** action and fill in:

| Config field | Example value | Notes |
|---|---|---|
| DNS Host | `seed.your-domain.tld` | The subdomain you delegated via `NS` |
| Nameserver | `vps.your-domain.tld` | The DynDNS hostname (CNAME target) |
| Contact Email | `you@your-domain.tld` | Goes into the SOA RNAME |
| DNS Listen Port | `53` | Must match the port sharing rule |
| Crawler Threads | `24` | Default is fine |
| DNS Threads | `4` | Default is fine |
| Testnet Mode | off | Unless crawling testnet |
| Tor SOCKS5 Proxy | leave empty | Or `127.0.0.1:9050` if Tor is running |

Save and **Start** the service.

### Step 6 — Verify end-to-end

From any external machine (4G phone is ideal — tests the real public path):

```
dig @seed.your-domain.tld seed.your-domain.tld
```

You should see A / AAAA answers — these are the peers the crawler has discovered. If you see `;; connection timed out` instead:

- check the FritzBox WAN IP matches what `vps.dynv6.net` resolves to,
- check UDP/53 is actually open (some ISPs block low ports outbound on residential lines),
- check the seeder service is running and listening on port 53 in its container logs.

### Troubleshooting cheatsheet

| Symptom | Likely cause | Fix |
|---|---|---|
| `vps.dynv6.net` resolves to a 100.64.x.x or 10.x.x.x address | You are behind CGNAT | Use IPv6 only, or rent a small VPS as a relay |
| DNS query works from inside LAN but not from internet | Port sharing wrong protocol (TCP vs UDP) | DNS needs **UDP/53** (the FritzBox also lets you add TCP/53 — do both for AXFR resilience) |
| `dig` shows `REFUSED` | DNS Host in config doesn't match the query name | Make sure the Config "DNS Host" exactly matches the subdomain you delegated |
| Seeder returns 0 answers | Crawler hasn't found peers yet | Give it 30–60 min; check the Stats action |

---

## Advanced / Reference

The sections below are the original concise reference for operators who already know what they're doing.

### Configuration

All settings are exposed via the StartOS **Config** action:

| Option | Description |
|---|---|
| DNS Host | FQDN the seeder will answer queries for (e.g. `seed.elektron-net.org`) |
| Nameserver | Host of this machine, used as SOA NS (e.g. `vps.elektron-net.org`) |
| Contact Email | Operator e-mail for SOA RNAME |
| DNS Listen Port | Port used by the built-in DNS server (default `53`) |
| Crawler Threads | Parallel P2P crawler threads (default `24`) |
| DNS Threads | Parallel DNS handler threads (default `4`) |
| Testnet Mode | Crawl Elektron Net testnet instead of mainnet |
| P2P Port Override | Override peer-dial port |
| Network Magic Override | Override 4-byte network magic (8 hex chars) |
| Minimum Block Height | Only serve peers at or above this height |
| Additional Seeds | Extra DNS / .onion bootstrap seeds |
| Tor SOCKS5 Proxy | `host:port` for dialing `.onion` peers |

### DNS setup

For the seeder to be useful you need an authoritative NS delegation pointing the chosen DNS host to your StartOS machine:

```
seed.example.com.   86400  IN  NS  vps.example.com.
vps.example.com.    86400  IN  A   <your StartOS public IP>
```

### Build

Locally:

```
make
```

Produces `elektron-seeder.s9pk`. Install with:

```
start-cli package install elektron-seeder.s9pk
```

#### CI build via GitHub Actions

The `.github/workflows/build.yml` workflow runs on every push, pull request, tag, and on manual `workflow_dispatch`. Each run:

1. Sets up QEMU + Docker Buildx (multi-arch x86_64 / aarch64)
2. Installs `start-cli`
3. Runs `make` to produce `elektron-seeder.s9pk`
4. Uploads the artifact for download

Pushing a `v*` tag (e.g. `git tag v0.1.0 && git push --tags`) publishes a stable GitHub Release. Branch pushes publish a `build-N` prerelease.

## License

MIT — see `LICENSE`.
