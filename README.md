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

### Step 2 — Configure DynDNS

You have **two options** for keeping the DynDNS record in sync. Pick **one**.

**Option A — Let the FritzBox do it (recommended if you use a FritzBox):**

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

**Option B — Let StartOS do it (when the router can't):**

Skip the FritzBox DynDNS tab and use the **built-in DynDNS Updater** in the StartOS Config action — see Step 5 below.

Verify (regardless of option) on any device:

```
nslookup vps.dynv6.net
```

It should return your current home WAN IP.

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

### Step 4 — Create the NS delegation at your domain registrar

In your registrar's DNS panel for `your-domain.tld`, add an `NS` record that delegates the `seed` sub-domain to a host whose A/AAAA records track your home IP.

You have **two equivalent ways** to do this:

**Simple (one record):** Point the NS directly at your DynDNS hostname:

| Type | Name | Value | TTL |
|---|---|---|---|
| `NS` | `seed` | `vps.dynv6.net.` | 86400 |

Done — no extra A/AAAA records needed at your registrar; dynv6 already provides them for `vps.dynv6.net`.

**Tidy (two records):** Keep the NS name inside your own domain and point a CNAME at dynv6:

| Type | Name | Value | TTL |
|---|---|---|---|
| `CNAME` | `vps` | `vps.dynv6.net.` | 300 |
| `NS` | `seed` | `vps.your-domain.tld.` | 86400 |

Either way, queries for `seed.your-domain.tld` end up at your home FritzBox's WAN IP, which forwards UDP/53 to the seeder.

Which to choose:

- **Simple** is one less record to manage. Some older registrars reject NS targets that point outside your own domain ("in-bailiwick" requirement) — Cloudflare DNS, INWX, Namecheap, Porkbun, deSEC, Hetzner DNS all accept it.
- **Tidy** keeps everything under your own domain; if you ever switch from dynv6 to another provider you only re-target the CNAME instead of touching the NS delegation.
- If `your-domain.tld` is DNSSEC-signed, leave the `seed` delegation **unsigned** (no DS record) — dynv6 doesn't sign your sub-zone, so validating resolvers would otherwise reject it.

Set the **Nameserver** field in the StartOS Config to whichever NS target name you used (`vps.dynv6.net` in the simple variant, `vps.your-domain.tld` in the tidy variant).

#### What if my registrar's DNS panel won't let me create an NS record on a subdomain?

Some registrars (e.g. **World4You**, and a number of other smaller hosters) only let you create `A`, `AAAA`, `CNAME`, `MX`, `TXT`, `SRV` records in their DNS editor — not `NS` records on subdomains. You can spot this when there is no `NS` option in the Type drop-down for a new record.

A `CNAME seed → vps.dynv6.net` is **not a workaround**: it would make resolvers fetch dynv6's own A record (your WAN IP) and return it directly to the client. The client would then never actually contact your seeder, so no peer list would be served. Only a true `NS` delegation works.

The clean solution is to **move DNS hosting to a free provider that does support subdomain NS records**, while keeping the domain registered where it is. Recommended: **deSEC.io** (free, EU-based, RFC-complete, DNSSEC included). Steps with `elektron-net.org` as example:

1. **Create a deSEC account** at https://desec.io and add `elektron-net.org` as a new domain. Note the assigned nameservers — typically `ns1.desec.io` and `ns2.desec.org`.
2. **Recreate your existing DNS records in deSEC** before switching anything. Copy every `A` / `AAAA` / `MX` / `TXT` / `CNAME` from your current registrar's DNS panel into deSEC (*Domain → +Record set*). This avoids breaking your website and mail when the cut-over happens.
3. **Add the seeder delegation** in deSEC — Subname `seed`, Type `NS`, Records `vps.dynv6.net.` (with trailing dot), TTL 3600.
4. **Switch the nameservers at your registrar** (at World4You: *myWorld → Domains → elektron-net.org → Nameserver verwalten*). Replace World4You's nameservers with `ns1.desec.io` and `ns2.desec.org`. Save. Propagation takes 1–24 h.
5. **Verify** once propagation is through:

   ```
   dig NS elektron-net.org          # should list ns1.desec.io / ns2.desec.org
   dig NS seed.elektron-net.org     # should list vps.dynv6.net
   dig @seed.elektron-net.org seed.elektron-net.org   # peer list from your seeder
   ```

You keep paying your registrar (World4You etc.) for the domain registration. deSEC only takes over the *DNS hosting* — which is exactly what enables subdomain NS delegations.

Other registrars/DNS providers known to support subdomain NS records out of the box if you'd rather move the domain fully: **Cloudflare**, **INWX**, **Namecheap**, **Porkbun**, **Hetzner DNS**.

### Step 5 — Configure the Elektron Seeder in StartOS

Open the **Elektron Seeder → Config** action and fill in:

| Config field | Example value | Notes |
|---|---|---|
| DNS Host | `seed.your-domain.tld` | The subdomain you delegated via `NS` |
| Nameserver | `vps.dynv6.net` or `vps.your-domain.tld` | Whichever NS target you used in Step 4 |
| Contact Email | `you@your-domain.tld` | Goes into the SOA RNAME |
| DNS Listen Port | `53` | Must match the port sharing rule |
| Crawler Threads | `24` | Default is fine |
| DNS Threads | `4` | Default is fine |
| Testnet Mode | off | Unless crawling testnet |
| Tor SOCKS5 Proxy | leave empty | Or `127.0.0.1:9050` if Tor is running |

If you chose **Option B** in Step 2 (no FritzBox DynDNS), also expand **DynDNS Updater** and set:

| DynDNS Updater field | Example |
|---|---|
| Enable DynDNS updater | on |
| IPv4 update URL | `https://dynv6.com/api/update?hostname=vps.dynv6.net&token=YOUR_HTTP_TOKEN&ipv4=<ipv4>` |
| IPv6 update URL | `https://dynv6.com/api/update?hostname=vps.dynv6.net&token=YOUR_HTTP_TOKEN&ipv6=<ipv6>` (optional) |
| Update interval (minutes) | `5` |

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
| Registrar rejects the NS record | "In-bailiwick" only registrar | Use the **Tidy** variant in Step 4 (CNAME + NS in your own domain) |
| Seeder returns 0 answers | Crawler hasn't found peers yet | Give it 30–60 min; check the Stats action |

---

## Advanced / Reference

The sections below are the original concise reference for operators who already know what they're doing.

### Configuration

All settings are exposed via the StartOS **Config** action:

| Option | Description |
|---|---|
| DNS Host | FQDN the seeder will answer queries for (e.g. `seed.elektron-net.org`) |
| Nameserver | Host of this machine, used as SOA NS (e.g. `vps.elektron-net.org` or your DynDNS hostname directly) |
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
| DynDNS Updater | Optional built-in DynDNS client (separate IPv4 and IPv6 update URLs, configurable interval) |

### DNS setup

For the seeder to be useful you need an authoritative NS delegation pointing the chosen DNS host to your StartOS machine. Two equivalent forms:

```
; Tidy form — NS target inside your own domain, A/AAAA records resolve to your IP
seed.example.com.   86400  IN  NS    vps.example.com.
vps.example.com.    86400  IN  A     203.0.113.10
vps.example.com.    86400  IN  AAAA  2001:db8::1
```

```
; Simple form — NS target points straight at a third-party DynDNS hostname
seed.example.com.   86400  IN  NS  vps.dynv6.net.
```

The tidy form keeps the NS name inside `example.com`, which some legacy registrars require ("in-bailiwick" NS) and decouples the provider switch (you only retarget the A/AAAA or a CNAME). The simple form is one record fewer and works at any modern registrar (Cloudflare, INWX, Namecheap, Porkbun, deSEC, Hetzner). Use the **Nameserver** Config field to match the NS target name you chose.

DNSSEC: if `example.com` is signed, leave the `seed` delegation unsigned (no DS) — DynDNS providers don't sign your sub-zone.

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
