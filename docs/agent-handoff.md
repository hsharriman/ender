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

- twenty-eight reasons are fully verified, and none are partial; `reflex` is the only partial one,
  and its `ref_ang` conclusion is blocked only because the kernel discards the
  `ang:` declaration line, whose audited meaning is exactly the
  `AngleWellFormed` that `conga_refl` needs;
- goal matching is still exact (`statement_eqb`), so a derived fact spelled
  with a reversed angle or segment will not close an otherwise identical goal
  even though step-to-step matching accepts it;
- the two largest remaining clusters are both blocked on `Audit.v` decisions
  rather than on effort, and in the same way — a statement whose audited
  meaning is too weak to support the rules that cite it.  `pgram_opp_sides` is
  actually *false* as audited (collinear counterexample in
  [`verified-checker.md`](verified-checker.md)); it needs a non-degeneracy
  conjunct on `IsParallelogram`.  The definitional-projection parallelogram
  rules are provable today but need quadrilateral objects in the kernel, which
  do not exist yet;
- the parallel-line family is blocked on an `Audit.v` decision, not on effort:
  the audited `Transversal` meaning records no sidedness, and alternate,
  corresponding, and same-side angles differ by nothing else.  See
  [`verified-checker.md`](verified-checker.md);
- statement coverage gates whole files: the kernel parser rejects a problem
  outright when any premise line names a statement it cannot decode, so a
  fixture stays out of reach until every statement it declares is supported;
- nondegeneracy comes from declared triangles or declared angles, and nothing
  else (`declared_angle` in `Checker.v`); a rule needing it with no such source
  must fail closed;
- the kernel does no ray reasoning, so an angle named by a point that merely
  lies on the right ray is not recognised.  `examples/overlap.txt` needs
  exactly this, and so does every overlapping-triangle proof;
- the parallel-line rules and everything built on them need Euclidean or
  2-dimensional hypotheses.  The mechanism for that now exists: `third_angle`
  introduces `Tarski_euclidean` in `Checker.v` right before its own soundness
  lemma, so the rules above it stay visibly neutral.  Prefer a GeoCoq route
  that keeps `Print Assumptions` clean; `nix flake check` now enforces it;
- the checker theorem is not shown to be non-vacuous: no model of the geometry
  hypotheses is exhibited.  GeoCoq has one and it compiles on Rocq 9 (branch
  `rocq-9-migration`), but instantiating it needs a real-closed field, and
  GeoCoq's algebraic layer and MathComp's real-closed library want disjoint
  MathComp versions.  See [`verified-checker.md`](verified-checker.md);
- the rich report schema is fully exported, but most step/graph/suggestion
  fields are intentionally empty until their producers are implemented;
- arc source is parsed losslessly but the TypeScript renderer has no Arc object;
- the public theorem currently quantifies over the project-wide GeoCoq 2D and
  Euclidean assumptions even where individual reason lemmas need less.
