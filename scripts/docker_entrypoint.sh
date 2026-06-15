#!/bin/sh
set -eu

CONFIG_FILE="/data/start9/config.yaml"

while [ ! -f "$CONFIG_FILE" ]; do
    echo "Waiting for $CONFIG_FILE ..."
    sleep 1
done

get() {
    yq -r "$1 // \"\"" "$CONFIG_FILE"
}

HOST=$(get '.host')
NAMESERVER=$(get '.nameserver')
MBOX=$(get '.mbox')
DNS_PORT=$(get '.["dns-port"]')
BIND_IP=$(get '.["bind-ip"]')
THREADS=$(get '.threads')
DNS_THREADS=$(get '.["dns-threads"]')
TESTNET=$(get '.testnet')
P2P_PORT=$(get '.["p2p-port"]')
MAGIC=$(get '.magic')
MIN_HEIGHT=$(get '.["min-height"]')
TOR_PROXY=$(get '.["tor-proxy"]')
IPV4_PROXY=$(get '.["ipv4-proxy"]')
IPV6_PROXY=$(get '.["ipv6-proxy"]')
WIPE_BAN=$(get '.["wipe-ban"]')
WIPE_IGNORE=$(get '.["wipe-ignore"]')

if [ -z "$HOST" ] || [ -z "$NAMESERVER" ]; then
    echo "ERROR: 'host' and 'nameserver' must be configured." >&2
    exit 1
fi

set -- -h "$HOST" -n "$NAMESERVER"

[ -n "$MBOX" ]        && set -- "$@" -m "$MBOX"
[ -n "$DNS_PORT" ]    && set -- "$@" -p "$DNS_PORT"
[ -n "$BIND_IP" ]     && set -- "$@" -a "$BIND_IP"
[ -n "$THREADS" ]     && set -- "$@" -t "$THREADS"
[ -n "$DNS_THREADS" ] && set -- "$@" -d "$DNS_THREADS"
[ "$TESTNET" = "true" ]      && set -- "$@" --testnet
[ -n "$P2P_PORT" ]    && set -- "$@" --p2port "$P2P_PORT"
[ -n "$MAGIC" ]       && set -- "$@" --magic "$MAGIC"
[ -n "$MIN_HEIGHT" ]  && set -- "$@" --minheight "$MIN_HEIGHT"
[ -n "$TOR_PROXY" ]   && set -- "$@" -o "$TOR_PROXY"
[ -n "$IPV4_PROXY" ]  && set -- "$@" -i "$IPV4_PROXY"
[ -n "$IPV6_PROXY" ]  && set -- "$@" -k "$IPV6_PROXY"
[ "$WIPE_BAN" = "true" ]     && set -- "$@" --wipeban
[ "$WIPE_IGNORE" = "true" ]  && set -- "$@" --wipeignore

# --seed (-s) can be repeated for each extra-seeds entry
EXTRA_SEEDS=$(yq -r '.["extra-seeds"][]?' "$CONFIG_FILE" 2>/dev/null || true)
if [ -n "$EXTRA_SEEDS" ]; then
    OLDIFS=$IFS
    IFS='
'
    for seed in $EXTRA_SEEDS; do
        [ -n "$seed" ] && set -- "$@" -s "$seed"
    done
    IFS=$OLDIFS
fi

# -w (--filter) can be repeated; the seeder also accepts comma-separated lists.
FILTERS=$(yq -r '.["service-filter"][]?' "$CONFIG_FILE" 2>/dev/null || true)
if [ -n "$FILTERS" ]; then
    OLDIFS=$IFS
    IFS='
'
    for flt in $FILTERS; do
        [ -n "$flt" ] && set -- "$@" -w "$flt"
    done
    IFS=$OLDIFS
fi

mkdir -p /data/seeder
chown -R seeder:seeder /data/seeder
cd /data/seeder

echo "Starting dnsseed with: $*"
exec su -s /bin/sh seeder -c "/usr/local/bin/dnsseed $*"
