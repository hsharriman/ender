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
make -C rocq native
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

`con_tri` claims only that two triangles are congruent, under some
correspondence of their vertices, so a proof may write either triangle in any
order; `con_tri_ordered` pairs the vertices as written. The congruence criteria
conclude either. `cpctc` on an ordered fact reads the parts off its
correspondence; on an unordered one it uses a correspondence the facts already
established witness — the three parts of a criterion, or an ordered congruence,
or a chain of those through other triangles, as after `con_tri_transitive` — so
it never draws a part the proof did not justify. A given `con_tri` names
no correspondence, so a premise meant for `cpctc` is written
`con_tri_ordered`.

Eight `// pass` occurrences, among them `examples/s2c2.txt`, `examples/s1c3.txt`
and `examples/s2c1.txt`, conclude a `con_tri` in an order their own criterion
does not establish and then use the correct correspondence for `cpctc`. They
were rejected while `con_tri` was ordered, and are accepted now.

`on_line` has since been strengthened to endpoint-inclusive segment membership,
and the kernel transports angle congruence across its same-ray spellings with
GeoCoq's `out2__conga`.  The same proved transport now recognizes points placed
on a segment by `midpt` and `intersect_seg`; this accepts the historical
alternate-interior converse proofs.

Two other textbook vertical-angle proofs remain fail-closed because they
declare segments but no triangle or angle that supplies nondegenerate rays.
Another old quadrilateral proof labels its transversal with points on the wrong sides;
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
  The triangle-shape and parallel-line groups are done, the forward
  quadrilateral rules with them, and now the diagonal converses
  (`rect_diag_con_conv`, `rhombus_diag_perp_conv`, `pgram_diag_bisect_conv`,
  `rhombus_opp_bisect_conv`) together with `isos_trap_con_diags` and
  `perp_bisector`.  Each converse concludes a quadrilateral statement and so
  must establish its well-formedness rather than read it off a dependency;
  the declaration is where that comes from, exactly as in
  `pgram_opp_sides_conv`.  `pgram_opp_angs_conv`, `isos_trap_base_angs_conv`,
  and `isos_trap_base_angs` join them through angle and length *ordering*
  rather than cancellation -- see [`verified-checker.md`](verified-checker.md).
  The group is now complete except for the forward diagonal
  rules
  (`pgram_diag_bisect`, `rhombus_diag_perp`, `kite_diag_perp`), which name the
  crossing point in their conclusions, so a proof that does not state where
  the diagonals meet leaves it unconstrained -- writing those rules will not
  accept the current fixtures, which is why they stay last.  `linear_pair_conv` is false as spelled and is
  written up as an open question in
  [`verified-checker.md`](verified-checker.md).  None of these unblocks a
  textbook proof: the corpus proofs still rejected are held up by defects in
  the proof files themselves, not by a missing curriculum rule.
- **Priority 3:** circles/arcs, similarity, centers, or historically ambiguous
  catalog entries. Resolve their semantics and side conditions before coding.
  Two of them are not merely deferred: `con_inscribed_angs` and
  `inscribed_angs` are false as the corpus spells them, because
  `inscribed_angle(c_OA, a_APB)` never says which arc the vertex is on and the
  answer flips between congruent and supplementary across arcs. They are
  blocked on a surface-syntax decision, written up under "Open question" in
  [`verified-checker.md`](verified-checker.md). Skip them.
  `radius_chord_bisect_conv` is a third: its catalog conclusion, `radius`,
  claims the far end of the bisector lies on the circle, which its premises do
  not entail.  The rest of the tangent and chord family
  (`tangent_perp_conv`, `con_tangents_ext`, `radius_chord_bisect`) is verified,
  as is `aa_sim`, whose audited similarity is the three angle congruences and
  so follows from the third-angle theorem already proved for `third_angle`.

Fixture count is evidence, not a semantic specification. The audited meanings
in `rocq/Ender/Audit.v` and a reason's explicit theorem are authoritative.
