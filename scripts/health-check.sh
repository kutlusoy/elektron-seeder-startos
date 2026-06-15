#!/bin/sh
# Auxiliary health probe — queries the local DNS server. Used by the
# `database` health check fallback. Exits 0 on success.
set -eu
HOST=${1:-localhost}
PORT=${2:-53}
NAME=${3:-test.invalid}
exec timeout 3 sh -c "echo > /dev/udp/$HOST/$PORT" 2>/dev/null
