cargo build --target-dir ~/target --target wasm32-unknown-unknown --release
wasm-bindgen --out-dir . --no-typescript --target no-modules ~/target/wasm32-unknown-unknown/release/asengine.wasm
#wasm-gc ~/target/wasm32-unknown-unknown/release/asengine.wasm asengine.wasm
