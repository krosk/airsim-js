cargo build --target-dir ~/target --target wasm32-unknown-unknown --release
wasm-gc ~/target/wasm32-unknown-unknown/release/asengine.wasm asengine.wasm
