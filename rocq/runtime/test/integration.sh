#!/usr/bin/env bash
# Check the native CLI's verdict, exit status, and structured output.
# Usage: integration.sh CHECKER
set -euo pipefail
checker=$1
here=$(cd "$(dirname "$0")" && pwd)
out=$(mktemp -d)
trap 'rm -rf "$out"' EXIT

"$checker" "$here/proofs/tutorial.txt" > "$out/tutorial.json"
diff -u "$here/tutorial.expected.json" "$out/tutorial.json"
cat "$here/proofs/tutorial.txt" | "$checker" - > "$out/tutorial-stdin.json"
diff -u "$out/tutorial.json" "$out/tutorial-stdin.json"

status=0
"$checker" "$here/proofs/tutinc.txt" > "$out/tutinc.json" || status=$?
if [[ $status -ne 1 ]]; then
  echo "expected the invalid proof to exit with status 1, got $status" >&2
  exit 1
fi
diff -u "$here/tutinc.expected.json" "$out/tutinc.json"

status=0
cat "$here/proofs/tutinc.txt" | "$checker" - > "$out/tutinc-stdin.json" || status=$?
if [[ $status -ne 1 ]]; then
  echo "expected the invalid proof on stdin to exit with status 1, got $status" >&2
  exit 1
fi
diff -u "$out/tutinc.json" "$out/tutinc-stdin.json"

"$checker" --report "$here/proofs/tutorial.txt" \
  | jq -e '.verdict == "accepted" and
           .problem.conclusion == "con_tri(t_ABC,t_ADC)" and
           (.presentation.steps | length > 0) and
           (.steps | type == "array") and (.graph | type == "object") and
           (.duplicates | type == "array") and (.goal | type == "object") and
           (.diagnostics | type == "array")' > /dev/null

for proof in "$here"/proofs/*.txt; do
  "$checker" --presentation "$proof" | jq -e 'type == "object"' > /dev/null
done
