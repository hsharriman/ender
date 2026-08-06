# Verified-reason implementation handoff

The foundational architecture is complete. Rocq is the sole parser and checker;
native OCaml and browser Wasm expose the same certified implementation. The
remaining long-tail objective is to implement verified reasons.

Start here:

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

- forty-four reasons are fully verified and none are partial: the `ang:`
  declaration line is read, so `reflex` concludes `ref_ang` for declared
  angles.  The complete-contract adapter still rejects reflexive statements
  in the *goal* position, deliberately (`project_goal_statement`): a `ref_*`
  goal would demand the same-name half of the audited meaning, and no
  textbook proof states one as its goal;
- goal matching is still exact (`statement_eqb`), so a derived fact spelled
  with a reversed angle or segment will not close an otherwise identical goal
  even though step-to-step matching accepts it;
- `QuadrilateralWellFormed` now includes `~ Col` on the first three vertices,
  which rules out the interleaved-collinear quadrilaterals that once made
  `pgram_opp_sides` *false* as audited (historical counterexample in
  [`verified-checker.md`](verified-checker.md)).  The core of the family is
  implemented and verified over the kernel quadrilateral layer; the
  diagonal-heavy remainder (`pgram_diag_bisect`, kite and trapezoid rules)
  is still fail-closed;
- the parallel-line family is implemented and verified: `altint`, `altext`,
  `corresp_ang`, `sameside_ang`, their converses, and `para_transitive`.
  The forwards are Euclidean (Playfair alternate interior angles); the
  converses are neutral (`l12_21_b`).  One naming limitation remains: a rule
  matches a line only by the transversal's flanking pair, so a segment that
  *ends* at a crossing (the Z-figure and quad-side transversals in the older
  fixtures, which also spell degenerate transversal premises) cannot yet name
  its line.  Those fixtures stay out of reach until a line-naming extension
  (match a segment through the crossing point plus one flank) or fixture
  rewrites;
- the inscribed-angle congruence rules (`con_inscribed_angs`, `inscribed_angs`)
  are false as audited in Euclidean models of dimension three or more: the
  audited `OnCircle` is equidistance from the center, which is a sphere, and
  vertices off a common circle see the same chord at different angles.  With
  `Tarski_2D` gone from the public theorem they cannot be implemented as
  audited.  The dimension-free fix mirrors GeoCoq itself: its
  `Annexes/inscribed_angle.v` proves the needed lemmas under
  `Tarski_euclidean` alone with explicit `Coplanar` hypotheses (only
  `chord_par_diam` sits in its `Tarski_2D` section), so the audited circle
  meanings need coplanarity conjuncts when this family is implemented — an
  `Audit.v` decision, like `Transversal` sidedness, which these rules also
  need (same-arc versus opposite-arc separates congruent from supplementary).
  `inscribed_semi` is unaffected: a right angle in a semicircle holds on
  spheres too.  Relatedly, `ArcCongruent` now requires congruent radii,
  matching the textbook "same or congruent circles" clause; without it,
  `con_chords_intersect_arcs` was false across circles of different sizes;
- statement coverage gates whole files: the kernel parser rejects a problem
  outright when any premise line names a statement it cannot decode, so a
  fixture stays out of reach until every statement it declares is supported;
- nondegeneracy comes from declared triangles or declared angles, and nothing
  else (`declared_angle` in `Checker.v`); a rule needing it with no such source
  must fail closed;
- the kernel does no ray reasoning, so an angle named by a point that merely
  lies on the right ray is not recognised.  The blocker is gone: `on_line` is
  now audited as segment membership (`Bet`), matching every corpus diagram,
  so a premise supplies the `Out` facts ray reasoning needs.  Measured over
  both corpora the capability would unlock two files;
- the parallel-line rules and everything built on them need the Euclidean
  hypothesis.  The mechanism for that now exists: `third_angle` introduces
  `Tarski_euclidean` in `Checker.v` right before its own soundness lemma, so
  the rules above it stay visibly neutral.  Prefer a GeoCoq route that keeps
  `Print Assumptions` clean; `nix flake check` now enforces it.  The relevant
  GeoCoq lemmas carry sidedness hypotheses (`TS`/`OS`) rather than an upper
  dimension axiom, and `Tarski_2D` has been removed from the public theorem
  entirely — a rule that genuinely needed planarity would require
  reintroducing it in `Audit.v`, which changes what the checker claims and is
  not a decision to take silently;
- the checker theorem is not shown to be non-vacuous: no model of the geometry
  hypotheses is exhibited.  GeoCoq has one and it compiles on Rocq 9 (branch
  `rocq-9-migration`), but instantiating it needs a real-closed field, and
  GeoCoq's algebraic layer and MathComp's real-closed library want disjoint
  MathComp versions.  See [`verified-checker.md`](verified-checker.md);
- the rich report schema is fully exported, but most step/graph/suggestion
  fields are intentionally empty until their producers are implemented;
- arc source is parsed losslessly but the TypeScript renderer has no Arc object;
- the public theorem quantifies over decidable point equality and the
  Euclidean assumption even where individual reason lemmas need less; the
  audited statement meanings themselves assume only bare
  `Tarski_neutral_dimensionless`, and `Tarski_2D` appears nowhere.
