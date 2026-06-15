VERSION := 0.1.0
PKG_ID  := elektron-seeder
S9PK    := $(PKG_ID).s9pk

.PHONY: all build install clean

all: $(S9PK)

$(S9PK):
	npm install
	npx start-cli build

install: $(S9PK)
	@if ! command -v start-cli >/dev/null 2>&1; then \
	    echo "start-cli not found in PATH"; exit 1; \
	fi
	start-cli package install $(S9PK)

clean:
	rm -rf node_modules dist $(S9PK)
