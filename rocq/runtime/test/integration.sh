#!/usr/bin/env bash
# Check that the native and Wasm checkers give the expected output on one
# accepted and one rejected proof, that the native report has every audited
# field, and that every fixture's presentation parses.
# Usage: integration.sh CHECKER WASM_DIR PROOFS_DIR
set -euo pipefail
checker=$1
wasm=$2
proofs=$3
here=$(cd "$(dirname "$0")" && pwd)
out=$(mktemp -d)
trap 'rm -rf "$out"' EXIT

for proof in tutorial tutinc; do
  file="$proofs/examples/$proof.txt"
  "$checker" "$file" > "$out/native.json" || true
  diff -u "$here/$proof.expected.json" "$out/native.json"
  node "$here/wasm_api.js" "$wasm/ender-checker-api.js" "$file" > "$out/wasm.json"
  diff -u "$here/$proof.expected.json" "$out/wasm.json"
done

if "$checker" "$proofs/examples/tutinc.txt" > /dev/null; then
  echo "invalid SSS proof was accepted" >&2
  exit 1
fi

"$checker" --report "$proofs/examples/tutorial.txt" \
  | jq -e '.verdict == "accepted" and
           .problem.conclusion == "con_tri(t_ABC,t_ADC)" and
           (.presentation.steps | length > 0) and
           (.steps | type == "array") and (.graph | type == "object") and
           (.duplicates | type == "array") and (.goal | type == "object") and
           (.diagnostics | type == "array")' > /dev/null

find "$proofs" -name '*.txt' -print0 | while IFS= read -r -d $'\0' proof; do
  "$checker" --presentation "$proof" | jq -e 'type == "object"' > /dev/null
done
