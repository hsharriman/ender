# Verified reason coverage

[`reason-coverage.json`](reason-coverage.json) is the exhaustive machine-readable
manifest for all 92 reason names in the retained Ender catalog. Each entry records:

- implementation status (`verified`, `partial`, or `unimplemented`);
- suggested priority, from 0 (already implemented) through 3 (defer);
- the weakest currently known axiom/library layer;
- every bundled fixture that invokes the reason; and
- a concise implementation note.

Regenerate the manifest and print current corpus parity from the reproducible
development environment:

```sh
nix develop
npm run reasonCoverage -- --write
```

For machine-readable live results, avoiding npm's banner:

```sh
node scripts/reason-coverage.mjs --json
```

The parity categories deliberately distinguish:

- `accepted`: accepted by the current verified kernel;
- `rejected-supported-slice`: uses only implemented reason names but fails;
- `unsupported-reason`: contains at least one unimplemented reason; and
- `parse-failure`: the theorem-bearing problem could not be decoded.

The manifest is generated from the untrusted metadata catalog, but its status
overrides reflect the actual constructors in `rocq/Ender/Syntax.v`. Updating a
reason requires updating both the kernel and this script. CI-facing tests cover
all corpus files through the extracted API.

## Priority policy

- **Priority 1:** foundational, frequently reused facts with comparatively
  local semantics—transitivity, midpoint/bisector definitions, vertical/right
  angles, third-angle, and RHL.
- **Priority 2:** ordinary triangle, line, and quadrilateral curriculum rules.
- **Priority 3:** circles/arcs, similarity, centers, or historically ambiguous
  catalog entries. Resolve their semantics and side conditions before coding.

Fixture count is evidence, not a semantic specification. The audited meanings
in `rocq/Ender/Audit.v` and a reason's explicit theorem are authoritative.
