# Verified Ender checker

This directory contains an executable, proved-sound checker with the complete
audited Ender statement language and a deliberately smaller verified reason
kernel. It is the sole executable checker; unsupported reasons fail closed.

## Scope

The slice parses Ender source text and supports:

- statements `con_seg`, `ref_seg`, `con_ang`, `ref_ang`, `con_tri`, `right`,
  `con_right`, `perp`, `midpt`, and `intersect_seg`;
- reasons `given`, `reflex`, `sas`, `sss`, `asa`, `aas`, `cpctc`,
  `con_seg_transitive`, `con_ang_transitive`, `con_tri_transitive`,
  `def_con_right`, `perp_con_ang`, `def_midpt`, and `vert_ang`;
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
both spanned point triples are declared triangles.

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
particular Cartesian model. [Geometry.v](../rocq/Ender/Geometry.v) derives the
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
object names cannot collide with grammar punctuation. Coverage now grows by
mechanizing the remaining reason theorems. Every trusted
statement has a total meaning. Binary
`sim_seg` has been replaced by four-segment
`proportion`; linear pairs have explicit ray geometry; `kite_premise` is a
specified compatibility macro; and arcs carry explicit minor/major identity.

See [the agent handoff](agent-handoff.md),
[reason-development workflow](reason-development.md), and
[coverage ledger](reason-coverage.md) for the reason-parity campaign.
