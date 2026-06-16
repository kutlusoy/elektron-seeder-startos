# Elektron Seeder

A DNS seeder for the [Elektron Net](https://github.com/kutlusoy/elektron-net). It crawls the P2P network and answers DNS A/AAAA queries with the addresses of currently-reachable peers, so fresh Elektron Net clients can bootstrap from a known-good list.

The package optionally ships with a **built-in DynDNS updater** so you can run the seeder from home behind a FritzBox without a static public IP.

---

## 1. Before you start

The seeder is **useless without DNS delegation**. You must own a domain and create an authoritative `NS` record that delegates a sub-domain (e.g. `seed.example.com`) to a host whose `A`/`AAAA` records point to the public IP of the machine running StartOS.

Minimal zone fragment:

```
seed.example.com.   86400  IN  NS  vps.example.com.
vps.example.com.    86400  IN  A    203.0.113.10
vps.example.com.    86400  IN  AAAA 2001:db8::1
```

If your StartOS has a **static public IP** you can fill in those A/AAAA records once and skip Section 4. If you run StartOS at home behind a router (FritzBox, cable modem, etc.) your WAN IP changes — Section 4 explains the two ways to handle that.

---

## 2. Minimal configuration

Open the **Config** action and fill in at least:

- **DNS Host** — the sub-domain you delegated (e.g. `seed.example.com`)
- **Nameserver** — the host of this machine (e.g. `vps.example.com`)
- **Contact Email** — published in the SOA RNAME

Then **Start** the service.

### Optional tuning

All other Config fields have inline descriptions. The most useful ones:

- **DNS Listen Port** (default `53`). Use a high port (e.g. `15353`) and redirect 53 → 15353 on your router if port 53 is unavailable.
- **Bind Address** — defaults to `::` (dual-stack). Set to `0.0.0.0` for IPv4-only.
- **Crawler Threads** (default `96`) / **DNS Threads** (default `4`).
- **Testnet Mode** — crawl the Elektron Net testnet instead of mainnet.
- **P2P Port Override** / **Network Magic Override** / **Minimum Block Height** — for forks or staging networks.
- **Additional Seeds** — plain DNS hosts *or* `.onion` addresses.
- **Tor SOCKS5 Proxy** (`-o`, typically `127.0.0.1:9050`) so `.onion` seeds and peers can be reached.
- **IPv4 / IPv6 SOCKS5 Proxies** (`-i` / `-k`) for transport-level egress filtering.
- **Service Flag Whitelist** (`-w`) — leave empty for the sane built-in defaults (NODE_NETWORK, NODE_NETWORK_LIMITED, witness / bloom / compact-filter / p2p-v2 variants).
- **Wipe Ban / Ignore List on Start** — one-shot toggles; disable again after the first restart.

---

## 3. Port 53 / port sharing

The seeder must be reachable on UDP/53 from the internet. On StartOS this means the host port is forwarded into the container automatically — what you have to do is forward UDP/53 from your router to your StartOS machine.

### FritzBox example

**Internet → Permit Access → Port Sharing → Add Device for Sharing**

| Field | Value |
|---|---|
| Device | your StartOS machine |
| Application | New application |
| Name | `Elektron Seeder DNS` |
| Protocol | **UDP** |
| Port to device | `53` |
| External port | `53` (same) |

Save. (Adding TCP/53 too doesn't hurt and helps if a client falls back from UDP.)

---

## 4. Running at home: keeping the DNS record in sync with your changing IP

If your ISP gives you a fresh WAN IP every few hours/days, the `A`/`AAAA` records under your `Nameserver` (e.g. `vps.example.com`) must be updated automatically. This is called **DynDNS**.

You have two independent options. Pick **one**.

### Option A — Router-driven DynDNS (recommended for FritzBox users)

The FritzBox has a built-in DynDNS client. **If you use this, leave the StartOS DynDNS Updater disabled.**

1. Sign up at https://dynv6.com — free, supports both IPv4 and IPv6.
2. Create a zone, e.g. `vps.dynv6.net`. This becomes the host that always tracks your home IP.
3. In dynv6: **My Account → Keys & Tokens** → copy the **HTTP Token**.
4. FritzBox GUI: **Internet → Permit Access → DynDNS** tab. Fill in:

| FritzBox field | Value (dynv6 example) |
|---|---|
| Use DynDNS | enabled |
| DynDNS provider | **User-defined** ("Benutzerdefiniert") |
| Update-URL | `https://dynv6.com/api/update?hostname=<domain>&ipv4=<ipaddr>&ipv6=<ip6addr>&token=<pass>` |
| Domainname | `vps.dynv6.net` |
| Username | `none` (dynv6 ignores it) |
| Password | the **HTTP Token** from step 3 |

DuckDNS variant (IPv4-only):

- Update-URL: `https://www.duckdns.org/update?domains=<domain>&token=<pass>&ip=<ipaddr>`
- Domainname: `my-seeder` (the part before `.duckdns.org`)
- Password: your DuckDNS token

Click **Apply** — the FritzBox substitutes `<domain>`, `<ipaddr>`, `<ip6addr>`, `<pass>` itself and updates dynv6/DuckDNS within seconds.

5. At your domain registrar, point `vps.example.com` to your DynDNS hostname:

| Type | Name | Value | TTL |
|---|---|---|---|
| `CNAME` | `vps` | `vps.dynv6.net` | 300 |
| `NS` | `seed` | `vps.example.com` | 86400 |

Done — `seed.example.com` is now reachable at your home IP, and the FritzBox keeps it current.

### Option B — Built-in DynDNS updater (when the router can't do it)

Use this when your router has no DynDNS client, or you don't want to configure it there. The seeder package contains a small background loop that does the update itself.

In the StartOS **Config** action, expand **DynDNS Updater** and set:

- **Enable DynDNS updater** — turn on
- **IPv4 update URL** — full HTTP(S) endpoint with `<ipv4>` (alias `<ipaddr>`) where the IP should be inserted. Leave empty to skip v4.
- **IPv6 update URL** — same for IPv6 with `<ipv6>` (alias `<ip6addr>`). Leave empty to skip v6.
- **Update interval (minutes)** — default `5`, minimum `1`.

IPv4 and IPv6 are **completely independent fields**. Fill in only what you need; you can even use different providers for each.

#### Provider URL templates

**dynv6.com** (free, supports v4 + v6):

- v4: `https://dynv6.com/api/update?hostname=seed.example.com&token=YOUR_HTTP_TOKEN&ipv4=<ipv4>`
- v6: `https://dynv6.com/api/update?hostname=seed.example.com&token=YOUR_HTTP_TOKEN&ipv6=<ipv6>`

**DuckDNS** (free, IPv4 only):

- v4: `https://www.duckdns.org/update?domains=my-seeder&token=YOUR_TOKEN&ip=<ipv4>`

**No-IP** (free tier renews every 30 days):

- v4: `https://USERNAME:PASSWORD@dynupdate.no-ip.com/nic/update?hostname=seed.example.com&myip=<ipv4>`

#### How the updater knows your public IP

The updater **does not** read the WAN IP from your router. It asks the internet:

```
curl -4 https://api.ipify.org    →  your public IPv4
curl -6 https://api6.ipify.org   →  your public IPv6
(falls back to icanhazip.com if ipify is unreachable)
```

The reply that ipify/icanhazip sends back contains the IP your traffic appears to come from — i.e. the WAN IP of the router that NAT-ed the request. So when your StartOS machine sits behind a FritzBox, this is exactly the FritzBox WAN IP, and that's what gets substituted into `<ipv4>` / `<ipv6>` before the URL is called.

Caveats:

- **CGNAT** (e.g. Vodafone Cable, mobile uplinks, DS-Lite tunnels): you do **not** have a unique public IPv4. ipify returns the carrier's shared address, which is useless for inbound DNS. Detect it by comparing the WAN IP shown in the FritzBox UI with `curl ifconfig.me` from inside the LAN — if they differ you are on CGNAT. Workaround: rely on IPv6 only, or rent a small VPS as a relay.
- **No IPv6**: if your ISP has no IPv6, the v6 update is skipped silently every tick (you see a `could not detect public IPv6` line in the service logs but the service keeps running).
- **`<ip6lanprefix>`** (a FritzBox-specific placeholder) is **not** available on StartOS. If you copy a FritzBox-style URL, remove or ignore `<ip6lanprefix>` — the updater replaces it with an empty string.

---

## 5. End-to-end verification

From an external network (4G phone is ideal — it bypasses your LAN):

```
nslookup vps.example.com       # should match your current WAN IP
dig @seed.example.com seed.example.com    # should return discovered peers
```

If `dig` times out:

- check that UDP/53 is open in the FritzBox port-sharing rule,
- check that your ISP does not block low ports outbound on residential lines (rare for inbound),
- check the service logs for `dnsseed` startup errors.

If the IP under `nslookup vps.example.com` doesn't match `curl ifconfig.me` from your home LAN: DynDNS update isn't reaching the provider — open the service logs and look for `[dyndns]` lines.

---

## 6. Troubleshooting cheatsheet

| Symptom | Likely cause | Fix |
|---|---|---|
| `vps.dynv6.net` resolves to 100.64.x.x / 10.x.x.x | You are behind CGNAT | Use IPv6 only, or use a VPS relay |
| DNS query works from LAN but not from internet | Wrong protocol in port-sharing | UDP/53 (and ideally also TCP/53) |
| `dig` returns `REFUSED` | Config **DNS Host** ≠ delegated subdomain | They must match exactly |
| Seeder returns 0 peer answers | Crawler hasn't filled its DB yet | Give it 30–60 min, then 6–24 h for full coverage |
| `[dyndns] IPv4 update failed: ...` in logs | Wrong token / wrong hostname / rate limit | Re-check the URL on the provider's site |
| `[dyndns] could not detect public IPv6` | ISP has no IPv6 routing | Leave **IPv6 update URL** empty |
| Service won't start: "not configured" | DNS Host or Nameserver empty | Fill both in Config and save |

---

## 7. Tips

- Give the crawler 6–24 h to fill its peer database before relying on it.
- Inspect `dnsseed.dump` inside the service data volume to see the tracked nodes.
- Run two independent seeders on separate networks for redundancy.
- If you use Option A (router DynDNS) **and** Option B (built-in updater) at the same time, they'll race — pick one.
