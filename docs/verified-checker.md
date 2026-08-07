# Verified Ender checker

This directory contains an executable, proved-sound checker with the complete
audited Ender statement language and a deliberately smaller verified reason
kernel. It is the sole executable checker; unsupported reasons fail closed.

## Scope

The slice parses Ender source text and supports:

- statements `con_seg`, `ref_seg`, `con_ang`, `ref_ang`, `con_tri`, `right`,
  `con_right`, `perp`, `midpt`, `intersect_seg`, `ang_bisect`, `on_line`,
  `isosceles`, `equilateral`, `equiangular`, `supplementary`, `para`,
  `parallelogram`, `rectangle`, `rhombus`, `isos_trapezoid`,
  `trapezoid_premise`, `isos_trapezoid_premise`, `kite_premise`,
  `transversal`, `radius`, `chord`, `diameter`, `tangent`,
  `inscribed_angle`, `minor_arc`, `major_arc`, and `con_arc`;
- reasons `given`, `reflex`, `sas`, `sss`, `asa`, `aas`, `rhl`, `cpctc`,
  `def_con_tri`, `con_seg_transitive`, `con_ang_transitive`,
  `con_tri_transitive`, `def_con_right`, `perp_con_ang`, `def_midpt`,
  `midpt_conv`, `vert_ang`, `def_ang_bisect`, `third_angle`, `def_isosceles`,
  `base_angle`, `base_angle_conv`, `def_equilateral`, `def_equiangular`,
  `equilat_equiang`, `equiang_equilat`, `con_supplements`,
  `con_supplements_same`, `def_perp`, `def_parallelogram`,
  `pgram_opp_sides`, `pgram_opp_side_para`, `rectangle_pgram`,
  `rhombus_pgram`, `rhombus_consec_sides`, `rhombus`, `rhombus_opp_bisect`,
  `rectangle`, `rect_diag_con`, `rect_pgram_ang`, `pgram_opp_angs`,
  `pgram_consec_angs`, `pgram_opp_sides_conv`, `pgram_consec_angs_conv`,
  `ang_bisect_conv`, `def_linear_pair`, `con_complements`,
  `con_complements_same`, `altint`, `altext`,
  `corresp_ang`, `sameside_ang`, `altint_conv`, `altext_conv`,
  `corresp_ang_conv`, `sameside_ang_conv`, `para_transitive`, `def_radius`,
  `inscribed_semi`, `con_chords_intersect_arcs`, and `tangent_perp`;
- one-character point names, named premises, segment, triangle, angle,
  quadrilateral, and circle declarations, numbered steps, and exact step
  dependencies.

Every rule that consults the diagram searches the premises for a specific one,
and that search now yields the premise rather than a bit: the rule is
`premise_found` of it and the report's `diagramDependencies` is
`premise_witness` of the same search, so a report cannot name a premise the
rule did not use.  That holds for the nested case too: a triangle criterion
transports an angle along an `on_line` premise from inside a search over six
correspondences, and the search returns the premises whichever reading won, so
the step names them.  Two dependencies leaning on one premise report it once.

Measured over the corpus, the accepted proofs declare forty diagram premises
between them and thirty-nine are named by the step that used them.  The
fortieth is `on_line(RM,X)` in `holt_s6-4_exer17_c1.txt`, which no rule
consults: its angles span declared triangles, so nothing needs to transport a
ray, and the distinctness it might have supplied comes from a `seg:` line
instead.  Reporting nothing for it is correct.

The report carries no suggestions.  Editor hints about which parts a reason
would relate read the untrusted reason catalog and the display geometry, which
the audited surface deliberately excludes, so they are computed in TypeScript
(`src/interface/core/waysToProve.ts`) rather than mechanized and reported.

Unsupported statements, reasons, or malformed relevant lines are rejected.
Coordinates on the `pt:` line are intentionally discarded and do not contribute
to the theorem's meaning.

Nondegeneracy has exactly four sources, and every rule that needs it draws on
one of them: a declared triangle, whose vertices are noncollinear; a declared
quadrilateral, whose meaning states all six vertex distinctnesses, so any
three of its vertices named apart are an angle with nondegenerate rays; a
declared angle, whose audited meaning is exactly `AngleWellFormed`; or a
declared segment, whose meaning is that its two ends are different points.
`reflex` concludes `ref_ang` only for a nondegenerate angle, which is what
`conga_refl` needs, and `rhombus_opp_bisect` reads a bisecting ray named by a
point along the diagonal only when a `seg:` line says that point is not the
corner itself. `Declarations` in `Syntax.v` bundles the declaration kinds
because no rule wants one without the others.

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
`con_ang` one, provided both angles are declared nondegenerate: two right
angles with nondegenerate rays are congruent.

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
`con_ang`, but only when both angles are declared nondegenerate: `Perp_at`
forces neither ray to be nondegenerate, so the declaration is what supplies
what `l11_16` needs. `def_midpt` reads the two congruent halves straight off the
`Midpoint` definition; midpoint statements, like segments, are unoriented.
`vert_ang` takes no step dependency: it looks up an `intersect_seg` diagram
premise and concludes either pair of opposite angles at the crossing, provided
both spanned point triples are declared nondegenerate. `def_ang_bisect` halves its
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

`third_angle` was the first implemented rule to need the parallel postulate;
the forward parallel-line rules, `para_transitive`, `pgram_opp_sides`,
`pgram_opp_side_para`, `rhombus_consec_sides`, and `inscribed_semi` now
share it.  The
assumption is introduced in `Checker.v` immediately before the first
Euclidean soundness lemma rather than at the top of the section, so every
lemma stated above that point is visibly free of it. GeoCoq's own Euclidean angle-sum theorem routes
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
`suppa2__conga123`, and the two complement rules from `sams2_suma2__conga123`.
The complement rules were once blocked on obtaining `SAMS` for a pair summing
to a right angle, which GeoCoq does not derive (`bet_suma__sams` covers only a
straight sum); the audited `Complementary` meaning now carries it, which is
also what makes the rules true.  What remains of the family is
`linear_pair_conv`, which needs a four-case analysis of the audited
`LinearPairMeaning` ray geometry.

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
No rule outside the circles needs an upper dimension axiom, but the final
theorem does assume `Tarski_2D`: the audited `OnCircle` is equidistance from a
center, which in three dimensions is a sphere, and the inscribed-angle
theorems are false there.  The alternative is `Coplanar` conjuncts in the
circle meanings, which GeoCoq's own `Annexes/inscribed_angle.v` uses.  That
is worse here, because a statement meaning is not only assumed but proved: it
is what a rule concluding that statement, and a proof whose goal is that
statement, must establish, so a planar student proof would be rejected for
never having derived a coplanarity it could not have known to state.  What
assuming the plane gives up is stated plainly in `Audit.v`: acceptance no
longer commits to anything about Euclidean models of higher dimension. [Geometry.v](../rocq/Ender/Geometry.v) derives the
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

`on_line(s, p)` now means `SegmentWellFormed s /\ OnSegment s p`: the corpus
uses it for a point on the drawn segment, not an arbitrary point on its
infinite line.  This endpoint-inclusive betweenness supports same-ray
transport through `out2__conga`.  The executable checker uses the same proved
transport for midpoint and segment-intersection witnesses when historical
proofs spell a transversal ray by an interior point.

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

## Open question: which arc an inscribed angle stands on

This one is not a proof obligation and cannot be settled inside `Audit.v`. It
needs a decision about the language Ender offers students, so it is written
out here rather than left as a stalled task.

Two inscribed angles standing on the same chord are congruent when their
vertices lie on the same arc and *supplementary* when they lie on opposite
arcs. The corpus spelling says neither:

```
[g_1] inscribed_angle(c_OA, a_APB)
[g_2] inscribed_angle(c_OA, a_AQB)
[03] con_inscribed_angs(1,2) -> con_ang(a_APB, a_AQB)
```

Nothing there distinguishes the two cases, so `con_inscribed_angs` and
`inscribed_angs` are false as spelled, and stay fail-closed. Note what this is
*not*: it is not the sphere problem, which assuming `Tarski_2D` fixed, and it
is not a weakness in `IsInscribedAngle` that a stronger meaning could repair —
the missing fact relates the two vertices to each other, so no property of a
single inscribed angle can supply it. The catalog entry hedges in the same
place, offering "the same chord **or arc**", and `inscribed_angs` carries an
explicit `TODO should these even be implemented?`.

Three ways out, none of them free:

1. **Leave both fail-closed.** Costs two textbook proofs
   (`holt_s11-4_exer32_c1`, `holt_s11-6_cio6_c1`). Since those live in the
   `geo-proof-dataset` submodule, options 2 and 3 do not recover them either
   without editing that corpus.
2. **Add a same-side premise form**, `sameside(AB, P, Q)` meaning `OS A B P Q`.
   Smallest surface change, and it reads as a diagram fact like `on_line`
   does. Students would have to state it, which is a real cost for a fact a
   figure makes obvious.
3. **Have `inscribed_angle` name its intercepted arc.** Closest to how the
   textbook talks ("the angle inscribed in arc AB"), and it makes the premise
   carry its own disambiguation. It breaks every existing spelling of the
   statement.

Whichever is chosen, the rules also need the arc-kind side condition that
separates congruent from supplementary, in the same way `Transversal`
sidedness does for the parallel-line family.

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
statement it declares is supported. Nondegeneracy comes second: the four
declaration kinds are its only sources, so a rule that needs nondegenerate
rays and has none of them to draw on must fail closed, as `reflex` on
`ref_ang` and `perp_con_ang` on `con_ang` do.

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
GeoCoq's lemmas consume, and the whole family is now implemented and
verified: the forward rules through the Playfair-derived alternate interior
angles, the converses neutrally through `l12_21_b`, and `para_transitive`
through a re-proof of GeoCoq's `par_trans` whose one `CopR` reflection call
(the source of an `Eqdep.Eq_rect_eq` dependency) is replaced by explicit
plane pasting, keeping the development axiom-free.

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

The core of the family is now verified: `def_parallelogram`,
`pgram_opp_sides`, `pgram_opp_side_para`, `rectangle_pgram`, `rhombus_pgram`,
and `rhombus_consec_sides`, over a kernel quadrilateral layer (a
`Quadrilateral` type, `quad:` declaration parsing and projection, and kernel
statements for `para` and every quadrilateral form) whose meanings are the
audited meanings verbatim, so the bridge is definitional. One route note for
future rules: GeoCoq's `par_2_plg` depends on `Eqdep.Eq_rect_eq`, so
opposite-sides congruence is proved through the Playfair-derived alternate
interior angles instead (`ender_alternate_interior` in `Geometry.v`), with
ASA along the diagonal through the audited crossing point; `par_cong_mid_ts`,
`plg_to_parallelogram`, and `plg_par` are axiom-clean and stay in use.
`rhombus_opp_bisect` joins them from the rhombus side: the two triangles a
diagonal cuts a rhombus into have three pairs of congruent sides, so `l11_51`
gives the corner halves at either end, neutrally.  `rect_diag_con` reads a
diagonal as the third side of a triangle on one of the rectangle's sides:
the two such triangles agree side-angle-side, since the corners between are
right angles and the legs are the Euclidean opposite sides.  The diagonal-heavy
remainder (`pgram_diag_bisect`, the kite rules, the trapezoid rules) is still
fail-closed.

See [the agent handoff](agent-handoff.md),
[reason-development workflow](reason-development.md), and
[coverage ledger](reason-coverage.md) for the reason-parity campaign.
