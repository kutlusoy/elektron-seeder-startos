# Changelog

All notable changes to **elektron-seeder-startos** are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-15

### Added
- Initial StartOS service wrapper for
  [kutlusoy/elektron-net-seeder](https://github.com/kutlusoy/elektron-net-seeder).
- Multi-arch (x86_64 / aarch64) Docker build from upstream `master`.
- Configuration action exposing every CLI flag of `dnsseed`:
  DNS host, nameserver, mbox, DNS port + bind IP, crawler / DNS thread counts,
  testnet toggle, P2P port override, network magic override, minimum block
  height, additional seeds (DNS + v2/v3 `.onion`), Tor SOCKS5 proxy (`-o`),
  IPv4 / IPv6 SOCKS5 proxies (`-i` / `-k`), service-flag whitelist (`-w`) and
  persistent wipe-ban / wipe-ignore toggles.
- Maintenance actions: Wipe Ban (one shot), Wipe Ignore (one shot),
  Reset Crawler Database.
- Monitoring action: Show Stats (head of `dnsseed.dump`).
- Service interfaces for UDP/TCP DNS on the configured port.
- Health checks: `process` (pgrep) and `database` (dnsseed.dat presence).
- Properties page summarising current configuration.
- Backups for the `main` volume (crawler DB + ban/ignore lists).
- Soft Tor dependency surfaced when a Tor proxy or `.onion` seed is configured.
- GitHub Actions workflow building `.s9pk` on push / PR / tag / manual dispatch
  and publishing tagged releases.
