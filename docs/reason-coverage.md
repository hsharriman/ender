# Verified reason coverage

[`reason-coverage.json`](reason-coverage.json) is the exhaustive machine-readable
manifest for all 92 reason names in the retained Ender catalog. Each entry records:

- implementation status (`verified`, `partial`, or `unimplemented`);
- suggested priority, from 0 (already implemented) through 3 (defer);
- the weakest currently known axiom/library layer;
- every bundled fixture that invokes the reason; and
- a concise implementation note.

Parity is reported over two corpora. The bundled fixtures in
`src/checker/proofs/` are mostly one-reason unit tests and are a biased sample;
the textbook proofs in the sibling `geo-proof-dataset` checkout are the
representative one, and the two numbers differ substantially. Set
`ENDER_DATASET` to point elsewhere, or leave the sibling checkout absent and
only fixture parity is reported.

Regenerate the manifest and print current corpus parity from the reproducible
development environment:

```sh
nix develop
npm run reasonCoverage -- --write
```

For just the current totals and parity categories:

```sh
npm run reasonCoverage:summary
```

For machine-readable live results, avoiding npm's banner:

```sh
node scripts/reason-coverage.mjs --json
```

The parity categories deliberately distinguish:

- `accepted`: accepted by the current verified kernel (acceptance wins over
  the labels below, which only ever explain a rejection);
- `rejected-supported-slice`: uses only implemented reason names but fails;
- `unsupported-reason`: contains at least one unimplemented reason; and
- `parse-failure`: the theorem-bearing problem could not be decoded.

Four proofs across the two corpora are marked `// pass` but land in
`rejected-supported-slice`, all for the same reason: a triangle-congruence step
names a correspondence its own argument does not establish, while the `cpctc`
step that follows relies on the correct one. The legacy checker evidently matched the two triangles up to
independent permutation, which is exactly what makes `con_tri` unsound as an
ordered claim.

- `examples/s2c2.txt` step 7 concludes `con_tri(t_ABD,t_BCD)` from an SAS
  argument establishing `A-C`, `B-B`, `D-D`.
- `examples/s1c3.txt` step 7 concludes `con_tri(t_QRP,t_MRN)` from an ASA
  argument establishing `P-M`, `R-R`, `Q-N`; its step 8 then reads `con_seg(QR,
  RN)` off the correspondence the argument actually proves.
- `geo-proof-dataset` `holt_s4-3_cio4_c1.txt` concludes `con_tri(t_JKN,t_MLN)`
  where the SSS argument gives `t_LMN` — the last two vertices transposed.
- `geo-proof-dataset` `holt_s4-6_exer9_c1.txt` concludes `con_tri(t_WXZ,t_YZX)`
  where the argument gives `t_YXZ`.

These are fixture defects, not missing reasons. Correspondence search already
covers all six readings of a conclusion, and permuting the two triangles
independently would defeat the point of an ordered `con_tri`; do not widen it.

The manifest is generated from the untrusted metadata catalog, but its status
overrides reflect the actual constructors in `rocq/Ender/Syntax.v`. Updating a
reason requires updating both the kernel and this script. CI-facing tests cover
all corpus files through the extracted API.

## Priority policy

- **Priority 1:** foundational, frequently reused facts with comparatively
  local semantics. All but `ang_bisect_conv` are now implemented; that one
  needs a decision about what fixes the bisecting ray, since the audited
  `AngleBisector` names it and a congruence of the two halves does not.
- **Priority 2:** ordinary triangle, line, and quadrilateral curriculum rules.
  The triangle-shape group is done; the largest remaining clusters are the
  parallel-line rules (which need the `para` and `transversal` statements and
  the Euclidean context `third_angle` already established) and the
  quadrilateral rules built on them.
- **Priority 3:** circles/arcs, similarity, centers, or historically ambiguous
  catalog entries. Resolve their semantics and side conditions before coding.

Fixture count is evidence, not a semantic specification. The audited meanings
in `rocq/Ender/Audit.v` and a reason's explicit theorem are authoritative.
