FROM debian:bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        ca-certificates \
        git \
        libboost-all-dev \
        libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
RUN git clone --depth 1 https://github.com/kutlusoy/elektron-net-seeder.git . \
    && make

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
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
RUN chmod +x /usr/local/bin/docker_entrypoint.sh

RUN useradd --system --create-home --home-dir /data --shell /usr/sbin/nologin seeder
WORKDIR /data

ENTRYPOINT ["/usr/bin/tini", "-g", "--", "/usr/local/bin/docker_entrypoint.sh"]
