cargo build --target-dir ~/target --target wasm32-unknown-unknown --release
cp ~/target/wasm32-unknown-unknown/release/*.wasm .
