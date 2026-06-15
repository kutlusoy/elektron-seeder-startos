# elektron-seeder-startos

StartOS service wrapper for [elektron-net-seeder](https://github.com/kutlusoy/elektron-net-seeder) — a DNS seeder for the Elektron Net P2P network.

Elektron Seeder is a crawler for the Elektron Net that exposes a list of reliable peers via a built-in DNS server. It:

- regularly revisits known nodes to check availability
- bans nodes after enough failures or bad behaviour
- accepts older nodes for address discovery but only serves recent, well-behaved peers
- keeps rolling statistics over 2h, 8h, 1d and 1w windows
- runs many crawler threads in parallel with very low CPU / RAM use

## Configuration

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

## DNS setup

For the seeder to be useful you need an authoritative NS delegation pointing the chosen DNS host to your StartOS machine:

```
seed.example.com.   86400  IN  NS  vps.example.com.
vps.example.com.    86400  IN  A   <your StartOS public IP>
```

## Build

Locally:

```
make
```

Produces `elektron-seeder.s9pk`. Install with:

```
start-cli package install elektron-seeder.s9pk
```

### CI build via GitHub Actions

The `.github/workflows/build.yml` workflow runs on every push, pull request, tag, and on manual `workflow_dispatch`. Each run:

1. Sets up QEMU + Docker Buildx (multi-arch x86_64 / aarch64)
2. Installs `start-cli`
3. Runs `make` to produce `elektron-seeder.s9pk`
4. Uploads the artifact for download

Pushing a `v*` tag (e.g. `git tag v0.1.0 && git push --tags`) additionally publishes the `.s9pk` to a GitHub Release.

## License

MIT — see `LICENSE`.
