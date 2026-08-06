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
the textbook proofs in the `geo-proof-dataset` submodule are the representative
one, and the two numbers differ substantially. Populate it with:

```sh
git submodule update --init
```

Until then only fixture parity is reported.

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

Eight proof occurrences across the two corpora are marked `// pass` but land
in `rejected-supported-slice` because a triangle-congruence step
names a correspondence its own argument does not establish, while the `cpctc`
step that follows relies on the correct one. The legacy checker evidently matched the two triangles up to
independent permutation, which is exactly what makes `con_tri` unsound as an
ordered claim.

- `examples/s2c2.txt` step 7 concludes `con_tri(t_ABD,t_BCD)` from an SAS
  argument establishing `A-C`, `B-B`, `D-D`.
- `examples/s1c3.txt` step 7 concludes `con_tri(t_QRP,t_MRN)` from an ASA
  argument establishing `P-M`, `R-R`, `Q-N`; its step 8 then reads `con_seg(QR,
  RN)` off the correspondence the argument actually proves.
- `examples/s2c1.txt` step 6 concludes `con_tri(t_FEJ,t_JGH)` although its SAS
  dependencies establish the correspondence `F-G`, `E-H`, `J-J`; step 7 uses
  that actual correspondence to conclude `con_seg(FJ,GJ)`.
- `geo-proof-dataset` `holt_s4-3_cio4_c1.txt` concludes `con_tri(t_JKN,t_MLN)`
  where the SSS argument gives `t_LMN` — the last two vertices transposed.
- `geo-proof-dataset` `holt_s4-6_exer9_c1.txt` concludes `con_tri(t_WXZ,t_YZX)`
  where the argument gives `t_YXZ`.

The bundled `s1c3`, `s2c1`, and `s2c2` defects are duplicated in the textbook
corpus, producing the other three occurrences.

`on_line` has since been strengthened to endpoint-inclusive segment membership,
and the kernel transports angle congruence across its same-ray spellings with
GeoCoq's `out2__conga`.  The same proved transport now recognizes points placed
on a segment by `midpt` and `intersect_seg`; this accepts the historical
alternate-interior converse proofs without relaxing ordered triangle claims.

The eight occurrences above are fixture defects, not missing reasons. Correspondence search already
covers all six readings of a conclusion, and permuting the two triangles
independently would defeat the point of an ordered `con_tri`; do not widen it.

Two other textbook vertical-angle proofs remain fail-closed because they
declare segments but no triangle or angle that supplies nondegenerate rays.
Another old quadrilateral proof spells a syntactically degenerate transversal;
these require fixture or audited-statement decisions, not permissive reason
matching.

The manifest is generated from the untrusted metadata catalog, but its status
overrides reflect the actual constructors in `rocq/Ender/Syntax.v`. Updating a
reason requires updating both the kernel and this script. CI-facing tests cover
all corpus files through the extracted API.

## Priority policy

- **Priority 1:** foundational, frequently reused facts with comparatively
  local semantics. This group is complete. `ang_bisect_conv` uses a
  conservative fail-closed schema: the congruent dependency must name exactly
  the two halves induced by the outer angle and shared ray in the conclusion.
- **Priority 2:** ordinary triangle, line, and quadrilateral curriculum rules.
  The triangle-shape and parallel-line groups are done, and the forward
  quadrilateral rules with them. What is left is mostly converses
  (`pgram_opp_sides_conv`, `pgram_opp_angs_conv`, `pgram_consec_angs_conv`,
  `rect_diag_con_conv`, `rhombus_diag_perp_conv`, `rhombus_opp_bisect_conv`),
  which conclude a quadrilateral statement and so must establish its
  well-formedness rather than read it off a dependency; the diagonal rules
  (`pgram_diag_bisect`, `rhombus_diag_perp`, `kite_diag_perp`), whose
  conclusions name the crossing point, so a proof that does not state where
  the diagonals meet leaves it unconstrained; the trapezoid and kite angle
  rules; and `linear_pair_conv` and `perp_bisector`.
- **Priority 3:** circles/arcs, similarity, centers, or historically ambiguous
  catalog entries. Resolve their semantics and side conditions before coding.
  Two of them are not merely deferred: `con_inscribed_angs` and
  `inscribed_angs` are false as the corpus spells them, because
  `inscribed_angle(c_OA, a_APB)` never says which arc the vertex is on and the
  answer flips between congruent and supplementary across arcs. They are
  blocked on a surface-syntax decision, written up under "Open question" in
  [`verified-checker.md`](verified-checker.md). Skip them.

Fixture count is evidence, not a semantic specification. The audited meanings
in `rocq/Ender/Audit.v` and a reason's explicit theorem are authoritative.
