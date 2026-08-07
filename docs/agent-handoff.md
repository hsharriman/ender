# Verified-reason implementation handoff

The foundational architecture is complete. Rocq is the sole parser and checker;
native OCaml and browser Wasm expose the same certified implementation. The
remaining long-tail objective is to implement verified reasons.

Start here:

0. If the question is why a particular corpus proof is rejected, read
   [`corpus-disagreements.md`](corpus-disagreements.md) first: most of them
   are defects in the proof file rather than missing capability, and it says
   which.
1. Read [`verified-checker.md`](verified-checker.md) for the trust boundary.
2. Read [`reason-coverage.md`](reason-coverage.md) and select a priority-1 rule.
3. Follow [`reason-development.md`](reason-development.md) exactly.
4. Treat [`reason-coverage.json`](reason-coverage.json) as the coverage ledger.

Suggested task prompt:

> Work through the reason-coverage manifest one reason at a time. For each
> reason, recover intended behavior from the audited statement semantics,
> fixtures, and historical checker; formulate a precise fail-closed rule;
> implement it in the Rocq parser/kernel; prove it sound using the weakest
> practical GeoCoq assumptions; add positive and negative fixtures; populate
> applicable rich-report fields; regenerate the manifest; and preserve all Nix,
> Rocq, Wasm, TypeScript, and corpus checks. Stop and document genuinely
> ambiguous semantics instead of guessing.

Known limitations relevant to prioritization:

- sixty-one reasons are fully verified and none are partial. The conservative
  `ang_bisect_conv` rule requires its congruent dependency to name exactly the
  two halves induced by the concluded outer angle and shared ray. The `ang:`
  declaration line is read, so `reflex` concludes `ref_ang` for declared
  angles.  The complete-contract adapter still rejects reflexive statements
  in the *goal* position, deliberately (`project_goal_statement`): a `ref_*`
  goal would demand the same-name half of the audited meaning, and no
  textbook proof states one as its goal;
- goal matching accepts the same unoriented spellings step-to-step matching
  does (`fact_eqb`): segments and angles up to reversal, symmetric pairs up
  to swap, and `ref_*` facts standing in for their `con_*` forms; `con_tri`
  stays ordered-exact per the correspondence semantics;
- `QuadrilateralWellFormed` now includes `~ Col` on the first three vertices,
  which rules out the interleaved-collinear quadrilaterals that once made
  `pgram_opp_sides` *false* as audited (historical counterexample in
  [`verified-checker.md`](verified-checker.md)).  The core of the family is
  implemented and verified over the kernel quadrilateral layer, and
  `rhombus_opp_bisect` with it: a rhombus diagonal cuts the two corners it
  runs between into congruent halves, by SSS on the two triangles it makes
  (`l11_51`, neutral).  The rule pairs the named corner with the named
  diagonal, so the diagonal must actually end at that corner, and it reads
  the diagonal only as literally spelled -- a proof that names the corner's
  ray by the crossing point instead (`geo-proof-dataset`
  `holt_s6-4_exer17_c1`, and the bundled `examples/rhombusOutside.txt`) needs
  the far point to be distinct from the vertex, which a `seg:` declaration now
  supplies, so both of those are accepted.  `holt_s6-4_cio4_c1` stays rejected
  and should: the point it names is not placed on the diagonal by any premise.
  `rect_diag_con` is verified too, by SAS
  between two of the right corners over the Euclidean opposite-sides
  theorem, and `pgram_consec_angs` through GeoCoq's
  `consecutive_interior_angles_postulate`: the shared side is a transversal
  of the other two, and the crossing diagonals put the two far corners on
  one side of it.  `pgram_opp_sides_conv` is the first verified converse, and
  shows what the rest of them need: its conclusion is a quadrilateral
  statement, so the well-formedness cannot be read off a dependency and comes
  from the declaration instead, while the parallels come from SSS along the
  diagonal and `l12_21_b` -- neutral, unlike the forward direction.
  `rect_pgram_ang` composes the opposite-corner and consecutive-corner
  theorems: one right corner forces its opposite by congruence and its two
  neighbours by supplementarity.  `pgram_consec_angs_conv` inverts the
  consecutive-corner theorem, and neutrally: continuing one of the two sides
  past their shared corner turns the supplement into an alternate interior
  angle, which `l12_21_b` reads back as the parallel.  The rest of the diagonal-heavy remainder (`pgram_diag_bisect`,
  kite and trapezoid rules) is still fail-closed;
- the parallel-line family is implemented and verified: `altint`, `altext`,
  `corresp_ang`, `sameside_ang`, their converses, and `para_transitive`.
  The forwards are Euclidean (Playfair alternate interior angles); the
  converses are neutral (`l12_21_b`).  A line may be named by its flanking pair
  or by a flank joined to the crossing point.  Converse angle matching also
  transports rays through endpoint-inclusive `on_line`, midpoint, and segment
  intersection premises.  Historical two-argument spellings such as
  `altint(2,d_01)` are accepted; the diagram label is compatibility metadata,
  while the rule still searches and validates the actual transversal;
- the inscribed-angle congruence rules (`con_inscribed_angs`, `inscribed_angs`)
  stay fail-closed **by decision**; do not attempt them.  Two problems stacked
  here and only one is fixed.  The audited `OnCircle` is equidistance from a
  center, which in three dimensions is a sphere; `Tarski_2D` is back in the
  public theorem for exactly that reason, so the meanings are now right.  What
  remains is not a meaning defect at all: the corpus spells these premises as
  `inscribed_angle(c_OA, a_APB)`, which never says which arc the vertex is on,
  and two inscribed angles on one chord are congruent from the same arc and
  supplementary from opposite ones.  No strengthening of `IsInscribedAngle`
  can supply that, because the missing fact relates the two vertices rather
  than describing one angle.  Admitting these rules needs a surface-syntax
  change, which is a curriculum decision and is written up with its options in
  [`verified-checker.md`](verified-checker.md).  `inscribed_semi` is unaffected
  either way: its chord is a diameter, and a right angle in a semicircle holds
  on spheres too.  Relatedly, `ArcCongruent` now requires congruent radii,
  matching the textbook "same or congruent circles" clause; without it,
  `con_chords_intersect_arcs` was false across circles of different sizes.
  The sphere-safe core of the family is implemented over a kernel circle
  and arc statement layer (`circ:` declarations; `radius`, `chord`,
  `diameter`, `tangent`, `inscribed_angle`, the nested arc spellings, and
  `con_arc`): `def_radius`, `inscribed_semi`, `con_chords_intersect_arcs`,
  and `tangent_perp` are verified.  `inscribed_semi` gets Thales axiom-free
  through `existential_triangle__rah` (witnessed by the lower-dimension
  points and `euclidean_trisuma__bet`) and `rah__thales_postulate` — both
  GeoCoq spellings of Thales (`midpoint_thales`, `thales_theorem`) rest on
  `Eqdep.Eq_rect_eq` and are unusable here;
- statement coverage gates whole files: the kernel parser rejects a problem
  outright when any premise line names a statement it cannot decode, so a
  fixture stays out of reach until every statement it declares is supported;
- nondegeneracy comes from declared triangles, quadrilaterals, angles, and
  segments, and nothing else; a rule needing it with no such source must fail
  closed.  A quadrilateral supplies it for any three of its vertices,
  consecutive or not, since its audited meaning states all six distinctnesses
  and a well-formed angle wants only two (`declared_angle`).  A `seg:` line is
  audited as `SegmentWellFormed`, which is exactly the one fact a ray needs --
  that its ends differ (`declared_segment`) -- and two of them sharing a vertex
  are an angle's two rays, which is how a figure with no triangle in it
  declares its angles nondegenerate;
- the kernel does ray reasoning where a triangle criterion expects a
  `con_ang` or `ref_ang` dependency: an expected angle also matches a fact
  whose ray points are linked to its own through `on_line` diagram premises
  (`ray_linked` and `angle_ray_matches` in `Checker.v`), with the expected
  angle required to be declared nondegenerate, the vertex matched exactly,
  and `out2__conga` carrying the congruence across the renaming — all
  neutral.  This accepts `examples/overlap.txt` end to end.  The other
  `on_line`-dependent file (`examples/s2inc1corrected.txt`) is still gated
  by an unrelated parser issue: a trailing step reference on its premise
  lines;
- the parallel-line rules and everything built on them need the Euclidean
  hypothesis.  The mechanism for that now exists: `third_angle` introduces
  `Tarski_euclidean` in `Checker.v` right before its own soundness lemma, so
  the rules above it stay visibly neutral.  Prefer a GeoCoq route that keeps
  `Print Assumptions` clean; `nix flake check` now enforces it.  The relevant
  GeoCoq lemmas carry sidedness hypotheses (`TS`/`OS`) rather than an upper
  dimension axiom, so nothing in that family needs the plane.  `Tarski_2D` is
  nevertheless assumed by the public theorem, for the circles alone; keep
  using it the same way `Tarski_euclidean` is used, introducing it in
  `Checker.v` only above the rules that genuinely need it;
- the checker theorem is not shown to be non-vacuous: no model of the geometry
  hypotheses is exhibited.  GeoCoq has one and it compiles on Rocq 9 (branch
  `rocq-9-migration`), but instantiating it needs a real-closed field, and
  GeoCoq's algebraic layer and MathComp's real-closed library want disjoint
  MathComp versions.  See [`verified-checker.md`](verified-checker.md);
- the rich report is produced, not merely exported, and reaches the parity the
  legacy TypeScript checker had: per-step status, reason name, conclusion,
  source line and dependencies; the dependency graph with its cycles and
  unused steps; duplicate derivations; and which step reached the goal.  None
  of it is trusted -- `accepted` reads the verdict alone.  Every step is
  judged on its own, and a failure spreads only along the graph: a step citing
  one that was not accepted is `blocked`, a step citing nothing broken stays
  judged however far below the failure it sits.  `provedBy` names the step the
  goal *rests on*, so it skips a rejected or blocked step, and the goal
  diagnostic distinguishes never stating the goal from stating it on a step
  that did not hold.  `diagramDependencies` is still empty; `suggestions` is
  gone from the audited schema, because the thing that filled it on `main`
  reads the untrusted reason catalog and the display geometry -- neither of
  which the kernel has, and neither of which it should acquire to compute a
  hint.  That producer lives in `src/interface/core/waysToProve.ts` now.
  The harness renders the rest; `summarizeReport`, `reportFindings`, and
  `buildAnnotatedLines` in `src/interface/core/reportAnnotations.ts` are the
  display logic, kept out of the React component so they can be tested against
  real reports;
- arc source is parsed losslessly but the TypeScript renderer has no Arc
  object; the presentation adapter passes nested arc arguments through as
  text rather than failing, while legacy `BR_OB`-style arc tokens still
  throw on purpose;
- the public theorem quantifies over decidable point equality, the Euclidean
  assumption, and `Tarski_2D` even where individual reason lemmas need less;
  the audited statement meanings themselves still assume only bare
  `Tarski_neutral_dimensionless`;
- `Complementary` now carries a `SAMS` conjunct, so it means what a textbook
  means: the two angles *together* make the right angle.  Without it `SumA`
  wraps, 170 degrees and 100 degrees would be complementary, and
  `con_complements` would be false — a null angle and a straight angle would
  both be complements of a right angle.  Both complement rules are verified
  over that conjunct through `sams2_suma2__conga123`.
