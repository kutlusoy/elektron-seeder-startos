VERSION := 0.1.2
PKG_ID  := elektron-seeder
S9PK    := $(PKG_ID).s9pk

.PHONY: all build install clean lint docker-build

all: $(S9PK)

$(S9PK): javascript/index.js
	start-cli s9pk pack -o $@

javascript/index.js: $(shell find startos -type f) tsconfig.json node_modules
	npm run check
	npm run build

node_modules: package.json
	npm install
	@touch node_modules

lint: node_modules
	npx tsc --noEmit

docker-build:
	docker build -t $(PKG_ID):$(VERSION) .

install: $(S9PK)
	@if ! command -v start-cli >/dev/null 2>&1; then \
	    echo "start-cli not found in PATH"; exit 1; \
	fi
	start-cli package install $(S9PK)

clean:
	rm -rf node_modules javascript $(S9PK)
