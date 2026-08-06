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
- one-character point names, named premises, triangle and angle declarations,
  numbered steps, and exact step dependencies.

Unsupported statements, reasons, or malformed relevant lines are rejected.
Coordinates on the `pt:` line are intentionally discarded and do not contribute
to the theorem's meaning.

Nondegeneracy has exactly two sources, and every rule that needs it draws on
one of them: a declared triangle, whose vertices are noncollinear, or a
declared angle, whose audited meaning is exactly `AngleWellFormed`. `reflex`
concludes `ref_ang` only for a declared angle, which is what `conga_refl`
needs; `Declarations` in `Syntax.v` bundles both because no rule wants one
without the other.

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
perpendicular segments — `Perp_at` states exactly that. It may also conclude
`con_ang`, but only when both angles span a declared triangle: `Perp_at` forces
neither ray to be nondegenerate, so the declaration is what supplies what
`l11_16` needs. `def_midpt` reads the two congruent halves straight off the
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
imply that meaning part returns a proposition which holds in every Euclidean
Tarski geometry, of any dimension.
```

[PublicParser.v](../rocq/Ender/PublicParser.v) implements all audited declaration
and statement forms, including nested minor/major arc syntax, and proves that
every accepted header satisfies `ProblemGrammar`. [Syntax.v](../rocq/Ender/Syntax.v)
and [Semantics.v](../rocq/Ender/Semantics.v) contain the internal representation
and compatibility semantics for the currently executable reason subset.
[CompleteChecker.v](../rocq/Ender/CompleteChecker.v) supplies the fail-closed
adapter, proves the semantic bridge, and inhabits `COMPLETE_VERIFIED_CHECKER`.
[Chars.v](../rocq/Ender/Chars.v) holds the character-list helpers those parsers
destructure text with. It is implementation-side and no claim rests on it: the
audit file states every lexical notion over `string` using `String.prefix`,
`String.index`, and `String.substring`, so it names one text representation and
converts nowhere.
The extracted native and Wasm programs now run that complete-contract checker.
Rocq
cannot establish that the deliberately chosen public meanings match a reader's
intent; this is why those meanings remain in the audit file.

The geometry is parametric over GeoCoq's Tarski axiom classes rather than a
particular Cartesian model.  The audited statement meanings are stated over
bare `Tarski_neutral_dimensionless` — no decidable point equality, no upper
dimension bound, no parallel postulate.  The soundness proofs additionally
assume `Tarski_neutral_dimensionless_with_decidable_point_equality`, since
GeoCoq's lemma library case-splits on point equality throughout.  Every reason
but `third_angle` is proved in that neutral setting; `third_angle` additionally
assumes `Tarski_euclidean`, which the audited final theorem already provides.
No rule needs an upper dimension axiom, so the final theorem posits none:
`Tarski_2D` appears nowhere, and acceptance commits to the entailment in
Euclidean Tarski models of every dimension. [Geometry.v](../rocq/Ender/Geometry.v) derives the
four triangle criteria from GeoCoq's existing neutral-geometry lemmas and makes
CPCTC a projection from ordered triangle congruence. The pinned upstream source
is [GeoCoq commit `90d8ce4`](https://github.com/GeoCoq/GeoCoq/commit/90d8ce484b32e0568b106c85d7e15be719a40180).

The theorem is conditional on the geometry hypotheses, which are universally
quantified rather than asserted — `Print Assumptions` reports no axioms
precisely because those hypotheses are not axioms, so it cannot speak to
whether any model satisfies them. Nothing here exhibits one, so `checker_sound`
would hold vacuously if none did.

It does not: GeoCoq builds a Euclidean Tarski model over any real-closed
field in `Algebraic/POF_to_Tarski.v` (`Rcf_to_T_euclidean`; the same file's
`Rcf_to_T2D` shows the model is two-dimensional, though the theorem no longer
asks for that). Adopting it was attempted and is preserved on the
`rocq-9-migration-model-attempt` branch; `rocq-9-migration` now carries only
the compiler migration that attempt was built on. That attempt works as far as
it goes — the whole development builds on Rocq 9 with **no source changes**,
still axiom-free — but it does not close this gap, for a reason worth recording
so nobody retries it blindly:

- GeoCoq's algebraic layer needs **MathComp 2.4**. On 2.5 it fails at
  `POF_to_Tarski.v` line 1134, identically under Coq 8.20 and Rocq 9, so that
  breakage tracks the library rather than the compiler. Upstream's port (merged
  2025-11-17, reverted the next day as PRs 52 and 53) targets 2.4 and is
  required even to get that far: the reverted tree does not build on Rocq 9 at
  all, since Rocq 9 split out the standard library.
- Instantiating the model needs a concrete real-closed field, which means
  `mathcomp-real-closed`. In this nixpkgs, real-closed 2.0.5 requires
  `mathcomp.all_boot`, introduced in **MathComp 2.5**.

A third audited statement is weaker than the diagram it describes, alongside
`Transversal` and `IsParallelogram`: `on_line(s, p)` means
`SegmentWellFormed s /\ Col ...`, so it places `p` anywhere on the line rather
than between the endpoints. Overlapping-triangle proofs need the stronger
reading — `examples/overlap.txt` identifies ray `GH` with ray `GD` from
`on_line(DG,H)`, which `Col` does not justify since `H` may lie beyond `G`,
making the angle a supplement rather than a congruence. `intersect_seg` shows
the audit is willing to state betweenness where it means it (`OnSegment` is
`Bet`), so this looks like an oversight rather than a deliberate choice.

The two requirements are disjoint. Closing the gap therefore needs one of:
GeoCoq's algebraic layer ported to MathComp 2.5 (the line-1134 work upstream
has not done), a real-closed release that works against 2.4, or upstream
re-landing its port against a newer MathComp. `Audit.v` records the obligation
that would then close it.

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
with the quadrilateral rules built on top. Every one of them is a theorem
about *which side* of the transversal each point lies on: alternate,
corresponding, and same-side angles are distinguished by nothing else, and
they have different conclusions. GeoCoq's lemmas say so explicitly —
`l12_21_b`, the alternate-interior converse, is neutral but takes
`TS A C B D` as a hypothesis. The audited `Transversal` meaning once recorded
only distinctness and collinearity, which fixed no side; it now states the
whole drawn configuration:

```rocq
BetS T1 I1 I2 /\ BetS I1 I2 T2 /\   (* exteriors out, interior between *)
BetS A I1 B  /\ BetS C I2 D  /\     (* named points flank their crossings *)
OS I1 I2 A C                        (* first-named points share a side *)
```

Every distinctness and collinearity of the weaker reading is derivable, and
the `OS` conjunct (through `TS`, which carries `~ Col`) keeps both lines
genuinely transverse. From these, the side classifications the rules need —
`TS I1 I2 A D` for alternate pairs and their kin — all follow, in the form
GeoCoq's lemmas consume. The family is now provable in principle and waits
only on kernel support for the `transversal` and `para` statements.

`para` itself deliberately keeps GeoCoq's inclusive `Par`, coincident-lines
disjunct and all, for two reasons. The catalog's `para_transitive` ("two
lines parallel to the same line are parallel to each other") is false under
a strict reading when the two outer segments happen to lie on one line, and
GeoCoq's `par_trans` proves it directly under the inclusive one. And no
angle rule needs strictness from `para`: inside any transversal figure the
coincident case is impossible, since two coincident "parallel" lines would
share both crossing points with the transversal and so *be* the transversal,
which the `OS` conjunct forbids.

The parallelogram family, which is the next largest cluster and includes the
most-used unimplemented reason in the textbook corpus (`pgram_opp_sides`, 12
uses), was blocked more sharply still: **`pgram_opp_sides` used to be false
as audited, not merely unproven.** `IsParallelogram q` is
`QuadrilateralWellFormed q` plus two `Parallel` facts, and GeoCoq's `Par`
admits collinear segments — its second disjunct is
`A <> B /\ C <> D /\ Col A C D /\ Col B C D`. Four interleaved points on one
line (say `0`, `1`, `5`, `7`) used to satisfy well-formedness — the diagonals
"cross" at `3` — and both `Par` facts by that second disjunct, giving an
audited "parallelogram" with `|AB| = 1` and `|CD| = 2`.

`QuadrilateralWellFormed` now carries a `~ Col` conjunct on the first three
vertices, which closes that hole for every quadrilateral statement at once
(parallelogram, trapezoid, kite, rhombus): the crossing-diagonals condition
already forbade exactly-three-collinear vertices, so one `~ Col` yields no
three vertices collinear, and either degenerate `Par` disjunct would force all
four onto one line. Both `Par` facts in a well-formed parallelogram are
therefore strict, and `pgram_opp_sides` is expected provable via GeoCoq's
`par_2_plg` (which wants exactly that `~ Col`) and `plg_cong`, both under the
`Tarski_euclidean` hypothesis the final theorem already provides.

Also provable is the definitional-projection
subset: `def_parallelogram`, `pgram_opp_side_para`, `rectangle_pgram`,
`rhombus_pgram`, and `rhombus_consec_sides` all just assemble or take apart the
audited definitions. The kernel now has the quadrilateral layer these need —
a `Quadrilateral` type, `quad:` declaration parsing and projection, and
kernel statements for `para` and every quadrilateral form, whose meanings are
the audited meanings verbatim so the bridge is definitional. The rules
themselves are next.

See [the agent handoff](agent-handoff.md),
[reason-development workflow](reason-development.md), and
[coverage ledger](reason-coverage.md) for the reason-parity campaign.
