#!/bin/sh
# Periodic DynDNS updater for the Elektron Seeder StartOS package.
#
# Reads config.yaml on every tick (so config changes take effect without restart).
# Substitutes <ipv4> / <ipaddr> / <ip6addr> / <ip6lanprefix> placeholders in the
# user-supplied update URL with the public IPs detected from the StartOS host.
#
# Skips silently if dyndns.enabled is false or both URLs are empty.

set -u

CONFIG_FILE="/data/start9/config.yaml"
DEFAULT_INTERVAL=300

log() { echo "[dyndns] $*"; }

get() {
    if [ -f "$CONFIG_FILE" ]; then
        yq -r "$1 // \"\"" "$CONFIG_FILE" 2>/dev/null
    fi
}

detect_ipv4() {
    curl -fsS --max-time 10 -4 https://api.ipify.org 2>/dev/null \
        || curl -fsS --max-time 10 -4 https://icanhazip.com 2>/dev/null \
        | tr -d '\r\n'
}

detect_ipv6() {
    curl -fsS --max-time 10 -6 https://api6.ipify.org 2>/dev/null \
        || curl -fsS --max-time 10 -6 https://icanhazip.com 2>/dev/null \
        | tr -d '\r\n'
}

substitute() {
    url="$1"; ipv4="$2"; ipv6="$3"
    # Common placeholder variants — keep both <foo> and ${foo} forms working.
    printf '%s' "$url" \
        | sed \
            -e "s|<ipv4>|$ipv4|g" \
            -e "s|<ipaddr>|$ipv4|g" \
            -e "s|\${ipv4}|$ipv4|g" \
            -e "s|<ipv6>|$ipv6|g" \
            -e "s|<ip6addr>|$ipv6|g" \
            -e "s|\${ipv6}|$ipv6|g" \
            -e "s|<ip6lanprefix>||g"
}

while :; do
    enabled=$(get '.dyndns.enabled')
    url_v4=$(get '.dyndns["update-url-v4"]')
    url_v6=$(get '.dyndns["update-url-v6"]')
    interval=$(get '.dyndns["interval-minutes"]')

    case "$enabled" in
        true|True|TRUE|1|yes) ;;
        *) sleep 60; continue ;;
    esac

    if [ -z "$interval" ] || [ "$interval" = "null" ]; then
        sleep_seconds=$DEFAULT_INTERVAL
    else
        sleep_seconds=$((interval * 60))
        [ "$sleep_seconds" -lt 60 ] && sleep_seconds=60
    fi

    if [ -n "$url_v4" ] && [ "$url_v4" != "null" ]; then
        ipv4=$(detect_ipv4)
        if [ -n "$ipv4" ]; then
            full=$(substitute "$url_v4" "$ipv4" "")
            log "updating IPv4 -> $ipv4"
            if ! curl -fsS --max-time 30 "$full" >/tmp/dyndns_v4.out 2>&1; then
                log "IPv4 update failed: $(cat /tmp/dyndns_v4.out)"
            fi
        else
            log "could not detect public IPv4 — skipping v4 update"
        fi
    fi

    if [ -n "$url_v6" ] && [ "$url_v6" != "null" ]; then
        ipv6=$(detect_ipv6)
        if [ -n "$ipv6" ]; then
            full=$(substitute "$url_v6" "" "$ipv6")
            log "updating IPv6 -> $ipv6"
            if ! curl -fsS --max-time 30 "$full" >/tmp/dyndns_v6.out 2>&1; then
                log "IPv6 update failed: $(cat /tmp/dyndns_v6.out)"
            fi
        else
            log "could not detect public IPv6 — skipping v6 update"
        fi
    fi

    sleep "$sleep_seconds"
done
