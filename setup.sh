#!/usr/bin/env bash
# Prepares the environment for running tests and serving the project.
# Run once per session — WASM artifacts are gitignored and must be rebuilt.
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# --- npm dependencies ---
if [ ! -d "$ROOT/node_modules" ]; then
    echo "[setup] Installing npm dependencies..."
    cd "$ROOT" && npm install
fi

# --- wasm-bindgen-cli ---
REQUIRED=$(awk '/^name = "wasm-bindgen"$/{found=1} found && /^version/{print; exit}' \
    "$ROOT/rust/Cargo.lock" | sed 's/version = "\(.*\)"/\1/')

INSTALLED=$(wasm-bindgen --version 2>/dev/null | awk '{print $2}' || echo "none")

if [ "$INSTALLED" != "$REQUIRED" ]; then
    echo "[setup] Installing wasm-bindgen-cli $REQUIRED (have: $INSTALLED)..."
    curl -fsSL "https://github.com/rustwasm/wasm-bindgen/releases/download/${REQUIRED}/wasm-bindgen-${REQUIRED}-x86_64-unknown-linux-musl.tar.gz" \
        | tar xzf - --strip-components=1 -C "$HOME/.cargo/bin" \
          "wasm-bindgen-${REQUIRED}-x86_64-unknown-linux-musl/wasm-bindgen"
fi

# --- WASM build ---
echo "[setup] Building WASM..."
cargo build \
    --manifest-path "$ROOT/rust/Cargo.toml" \
    --target-dir ~/target \
    --target wasm32-unknown-unknown \
    --release

wasm-bindgen \
    --out-dir "$ROOT/rust" \
    --no-typescript \
    --target no-modules \
    ~/target/wasm32-unknown-unknown/release/asengine.wasm

echo "[setup] Done. Run: npm test"
