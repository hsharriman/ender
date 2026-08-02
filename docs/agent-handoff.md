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

- only fifteen reasons are fully verified; `reflex` and `perp_con_ang` are
  partial;
- goal matching is still exact (`statement_eqb`), so a derived fact spelled
  with a reversed angle or segment will not close an otherwise identical goal
  even though step-to-step matching accepts it;
- statement coverage gates whole files: the kernel parser rejects a problem
  outright when any premise line names a statement it cannot decode, so a
  fixture stays out of reach until every statement it declares is supported;
- angles obtain their nondegenerate rays from declared triangles
  (`declared_angle` in `Checker.v`); a rule needing nondegeneracy and having no
  such source must fail closed, as `reflex` on `ref_ang` and `perp_con_ang` on
  `con_ang` do;
- `third_angle`, the parallel-line rules, and everything built on them need
  Euclidean or 2-dimensional hypotheses that the kernel's soundness section
  does not yet assume, even though the audited final theorem does. `rhl` is
  not among them: GeoCoq proves it in neutral geometry as
  `cong2_per2__cong_3`, and it is now implemented;
- the rich report schema is fully exported, but most step/graph/suggestion
  fields are intentionally empty until their producers are implemented;
- arc source is parsed losslessly but the TypeScript renderer has no Arc object;
- the public theorem currently quantifies over the project-wide GeoCoq 2D and
  Euclidean assumptions even where individual reason lemmas need less.
