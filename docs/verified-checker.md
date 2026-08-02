# Verified Ender checker

This directory contains an executable, proved-sound checker with the complete
audited Ender statement language and a deliberately smaller verified reason
kernel. It is the sole executable checker; unsupported reasons fail closed.

## Scope

The slice parses Ender source text and supports:

- statements `con_seg`, `ref_seg`, `con_ang`, `ref_ang`, `con_tri`, `right`,
  `con_right`, `perp`, `midpt`, `intersect_seg`, `ang_bisect`, `on_line`,
  `isosceles`, `equilateral`, `equiangular`, and `supplementary`;
- reasons `given`, `reflex`, `sas`, `sss`, `asa`, `aas`, `rhl`, `cpctc`,
  `def_con_tri`, `con_seg_transitive`, `con_ang_transitive`,
  `con_tri_transitive`, `def_con_right`, `perp_con_ang`, `def_midpt`,
  `midpt_conv`, `vert_ang`, `def_ang_bisect`, `third_angle`, `def_isosceles`,
  `base_angle`, `base_angle_conv`, `def_equilateral`, `def_equiangular`,
  `equilat_equiang`, `equiang_equilat`, `con_supplements`,
  `con_supplements_same`, and `def_perp`;
- one-character point names, named premises, triangle declarations, numbered
  steps, and exact step dependencies.

Unsupported statements, reasons, or malformed relevant lines are rejected.
`ref_ang` is parsed but no reflexive-angle step is accepted yet: GeoCoq angle
congruence has nondegenerate-ray hypotheses that the present declarations do
not supply. Coordinates on the `pt:` line are intentionally discarded and do
not contribute to the theorem's meaning.

Triangle congruence is ordered: `con_tri(t_ABC,t_DEF)` means the correspondence
`A-D`, `B-E`, `C-F`. It comprises the three corresponding side congruences and
the three corresponding angle congruences. SSS, SAS, ASA, and AAS search all
six readings of that correspondence — its three cyclic rotations, each in both
orientations — since a criterion's dependency order, not the conclusion's
spelling, fixes which vertex plays which role. Segment and angle notation are
both unoriented: `AB`/`BA` and `a_XYZ`/`a_ZYX` name the same object, and a
congruence may be written with its two sides exchanged. Every declared triangle
carries the semantic side condition that its vertices are noncollinear, which
is invariant under renaming its vertices, so a declared triangle may be
referred to by any permutation of its vertex list.

A triangle criterion may also consume a `con_right` fact where it expects a
`con_ang` one, provided both angles span the vertices of a declared triangle:
two right angles with nondegenerate rays are congruent.

The three transitivity rules take two congruence dependencies of the same
object kind and conclude the congruence of the two unshared objects. The shared
object may sit on either side of either dependency and is identified exactly as
the corresponding congruence test does: segments and angles match unoriented,
triangles match exactly. Because the shared object is only
used to relay an already established congruence, these rules need no
reflexivity and therefore no nondegenerate-ray hypothesis.

`def_con_right` concludes `con_right` or `con_ang` from two `right` premises;
the audited `right` meaning carries the nondegenerate rays that GeoCoq's
`l11_16` needs. `perp_con_ang` concludes `con_right` for any two angles whose
vertex is the foot of the perpendicular and whose rays end on the two
perpendicular segments — `Perp_at` states exactly that. Its `con_ang`
conclusion remains fail-closed: `Perp_at` does not force either ray to be
nondegenerate. `def_midpt` reads the two congruent halves straight off the
`Midpoint` definition; midpoint statements, like segments, are unoriented.
`vert_ang` takes no step dependency: it looks up an `intersect_seg` diagram
premise and concludes either pair of opposite angles at the crossing, provided
both spanned point triples are declared triangles. `def_ang_bisect` halves its
angle; which endpoint of the ray names the vertex is a condition on point
names, so the checker decides it rather than assuming it.

`rhl` is the one rule whose surface form the corpus does not pin down: the two
bundled fixtures disagree about whether the hypotenuse or the leg is cited
second, and the catalog only records that both are segment congruences. Both
readings are therefore accepted, since each is separately sound. Two legs are
still refused, and the correspondence search already covers which of the two
legs is cited. GeoCoq proves RHL in neutral geometry as `cong2_per2__cong_3`,
so this rule needs no Euclidean hypothesis.

`midpt_conv` is the converse of `def_midpt`. Congruent halves alone place no
point between the endpoints, so it additionally requires an `on_line` diagram
premise: on a line there is exactly one point equidistant from two distinct
points (GeoCoq `l7_20`).

`third_angle` is the only implemented rule that needs the parallel postulate.
Its assumption is introduced in `Checker.v` immediately before its soundness
lemma rather than at the top of the section, so every lemma stated above that
point is visibly free of it. GeoCoq's own Euclidean angle-sum theorem routes
through `l12_21_a`, which rests on `Eqdep.Eq_rect_eq`;
`euclidean_trisuma__bet` in `Geometry.v` goes through Playfair instead, which
keeps the development free of axioms. `nix flake check` fails if
`Print Assumptions` ever reports one again.

The three triangle-shape statements each name one declared triangle, which is
where their nondegeneracy comes from, and their meanings mirror the audited
ones exactly — including the audited angle vertex order — so they project both
as premises and as goals. `base_angle` and its converse are pons asinorum in
both directions (GeoCoq `l11_44_1`), applied at whichever vertex of a declared
triangle is the apex; `equilat_equiang` and `equiang_equilat` apply it at two
apexes in turn. `def_equilateral`, `def_equiangular`, and `def_con_tri` read
their conclusions off the cited parts; their dependency order is the one the
catalog lists, since unlike a triangle criterion they cite every part and so
have no correspondence left to search.

`con_supplements` and `con_supplements_same` come straight from GeoCoq's
`suppa2__conga123`.  The rest of the angle-arithmetic family is deferred for
specific reasons, not for lack of time: `con_complements` and its `_same`
variant need `SAMS` for a pair summing to a right angle, which GeoCoq does not
provide directly (`bet_suma__sams` only covers a straight sum); and
`def_linear_pair` and `linear_pair_conv` need a four-case analysis of the
audited `LinearPairMeaning` ray geometry.

`def_perp` turns a right angle into perpendicularity. `Perp_at` demands that
*every* point of each line meet at right angles, not just the two the angle
names, so the rule additionally requires an `on_line` premise placing the foot
on the target line; that is what lets `perp_in_col_perp_in` carry the right
angle from the ray to the whole line. With it, `examples/s1c2.txt` — a nine
step curriculum proof — is accepted end to end.

## Soundness boundary

[Audit.v](../rocq/Ender/Audit.v) is the single human-audit surface. It imports
no Ender implementation file and contains only the intended final contract:

1. `problemPart`, which returns the substring after the `pt:` line and before
   `steps:`;
2. all 41 public statement forms and all five declaration forms;
3. their Tarski-geometric meanings and explicit nondegeneracy conditions;
4. canonical surface spellings and a declarative header grammar;
5. a total `statementMeaning : PublicStatement -> Prop` and
   `meaning : string -> option Prop`, where optionality belongs only to parsing;
   and
6. the final parser-soundness and checker-soundness signatures.

There is no `VERIFIED_SLICE_CHECKER` switch or second audit contract. The
smaller executable reason kernel is an implementation detail outside the audit
file. `parseProblem` must prove the trust-relevant direction—every successful
parse satisfies the independent `ProblemGrammar`. Parser completeness remains
a separate usability theorem.

That proposition states:

```text
problemPart source = Some part
and checker source = true
imply that meaning part returns a proposition which holds in every supported
two-dimensional Euclidean Tarski geometry.
```

[PublicParser.v](../rocq/Ender/PublicParser.v) implements all audited declaration
and statement forms, including nested minor/major arc syntax, and proves that
every accepted header satisfies `ProblemGrammar`. [Syntax.v](../rocq/Ender/Syntax.v)
and [Semantics.v](../rocq/Ender/Semantics.v) contain the internal representation
and compatibility semantics for the currently executable reason subset.
[CompleteChecker.v](../rocq/Ender/CompleteChecker.v) supplies the fail-closed
adapter, proves the semantic bridge, and inhabits `COMPLETE_VERIFIED_CHECKER`.
The extracted native and Wasm programs now run that complete-contract checker.
Rocq
cannot establish that the deliberately chosen public meanings match a reader's
intent; this is why those meanings remain in the audit file.

The geometry is parametric over GeoCoq's
`Tarski_neutral_dimensionless_with_decidable_point_equality`, rather than a
particular Cartesian model.  Every reason but `third_angle` is proved in that
neutral setting; `third_angle` additionally assumes `Tarski_euclidean`, which
the audited final theorem already provides. [Geometry.v](../rocq/Ender/Geometry.v) derives the
four triangle criteria from GeoCoq's existing neutral-geometry lemmas and makes
CPCTC a projection from ordered triangle congruence. The pinned upstream source
is [GeoCoq commit `90d8ce4`](https://github.com/GeoCoq/GeoCoq/commit/90d8ce484b32e0568b106c85d7e15be719a40180).

Extraction and compilation add a conventional trusted-computing boundary:
Rocq's kernel checks the proof, while Rocq extraction, the OCaml compiler, and
`wasm_of_ocaml` produce the executable artifacts. The geometric proof terms are
erased from those artifacts; runtime checking is ordinary computation.

## Reproducible build

The [Nix flake](../flake.nix) pins Nixpkgs, GeoCoq, and the build tooling. From
the repository root:

```sh
nix flake check -L
nix run . -- src/checker/proofs/examples/tutorial.txt
nix build .#ender-checker-wasm
```

`nix flake check` kernel-checks the Rocq development, runs positive and negative
Rocq examples, extracts the checker, builds native and Wasm versions, and runs
both against repository proof files. The compatibility command emits
`{isCorrect, issues}` or `{isCorrect, errors}` JSON and uses exit codes 0, 1,
and 2 for accepted, rejected, and failed-to-parse results respectively.
`ender-checker --report FILE` emits every field of the audited `CheckReport`.
The callable Wasm equivalents are `enderCheckProof`, `enderParsePresentation`,
and `enderCheckReport`.
The Wasm bundle is under
`result/share/ender-checker-wasm/` after the final command.

## Next work

The complete declaration and statement parser, its soundness and completeness
proofs, semantic adapter, and final checker theorem are implemented. The
audited lexical grammar enforces Ender's `[A-Z]` point-label restriction, so
object names cannot collide with grammar punctuation. Every trusted statement
has a total meaning. Coverage now grows by mechanizing the remaining reason
theorems.

Two things gate that growth, in this order. Statement coverage comes first:
the kernel parser rejects a problem outright when any premise line names a
statement it cannot decode, so a whole fixture stays out of reach until every
statement it declares is supported. Nondegeneracy comes second: declared
triangles are currently the only source of it, so a rule that needs
nondegenerate rays and has no declared triangle to draw on must fail closed,
as `reflex` on `ref_ang` and `perp_con_ang` on `con_ang` do.

The largest remaining cluster is the parallel-line family — `altint`,
`altint_conv`, `altext`, `corresp_ang`, `sameside_ang` and their converses,
with the quadrilateral rules built on top. **These cannot be verified against
the audited meanings as they stand.** Every one of them is a theorem about
*which side* of the transversal each point lies on: alternate, corresponding,
and same-side angles are distinguished by nothing else, and they have
different conclusions. GeoCoq's lemmas say so explicitly — `l12_21_b`, the
alternate-interior converse, is neutral but takes `TS A C B D` as a hypothesis.
The audited `Transversal` meaning records only distinctness and collinearity:

```coq
point a <> point b /\ point c <> point d /\ point t1 <> point t2 /\
Col a b i1 /\ Col c d i2 /\ Col t1 t2 i1 /\ Col t1 t2 i2 /\ i1 <> i2
```

Nothing there fixes a side, so no sound rule can tell an alternate pair from a
corresponding one. Closing this needs a decision about `Audit.v` — either
strengthen `Transversal` to state the sidedness, or add a statement that does
— and that changes what the checker claims, so it is not a decision to take
silently.

See [the agent handoff](agent-handoff.md),
[reason-development workflow](reason-development.md), and
[coverage ledger](reason-coverage.md) for the reason-parity campaign.
