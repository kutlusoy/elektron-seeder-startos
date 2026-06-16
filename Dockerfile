FROM debian:bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        ca-certificates \
        git \
        libboost-all-dev \
        libssl-dev \
    && rm -rf /var/lib/apt/lists/*

ARG SEEDER_REPO=https://github.com/kutlusoy/elektron-net-seeder.git
ARG SEEDER_REF=main

WORKDIR /build
RUN git clone "$SEEDER_REPO" . \
    && git checkout "$SEEDER_REF" \
    && make

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        libboost-system1.74.0 \
        libboost-filesystem1.74.0 \
        libboost-thread1.74.0 \
        libssl3 \
        libcap2-bin \
        tini \
        yq \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/dnsseed /usr/local/bin/dnsseed
RUN setcap 'cap_net_bind_service=+ep' /usr/local/bin/dnsseed

COPY scripts/docker_entrypoint.sh /usr/local/bin/docker_entrypoint.sh
COPY scripts/health-check.sh      /usr/local/bin/health-check.sh
COPY scripts/dyndns_updater.sh    /usr/local/bin/dyndns_updater.sh
RUN chmod +x /usr/local/bin/docker_entrypoint.sh \
             /usr/local/bin/health-check.sh \
             /usr/local/bin/dyndns_updater.sh

RUN useradd --system --create-home --home-dir /data --shell /usr/sbin/nologin seeder
WORKDIR /data

ENTRYPOINT ["/usr/bin/tini", "-g", "--", "/usr/local/bin/docker_entrypoint.sh"]
