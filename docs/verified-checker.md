# Verified Ender checker

This directory contains an executable, proved-sound checker with the complete
audited Ender statement language and a deliberately smaller verified reason
kernel. It is not yet a replacement for the TypeScript checker.

## Scope

The slice parses Ender source text and supports:

- statements `con_seg`, `ref_seg`, `con_ang`, `ref_ang`, and `con_tri`;
- reasons `given`, `reflex`, `sas`, `sss`, `asa`, `aas`, and `cpctc`;
- one-character point names, named premises, triangle declarations, numbered
  steps, and exact step dependencies.

Unsupported statements, reasons, or malformed relevant lines are rejected.
`ref_ang` is parsed but no reflexive-angle step is accepted yet: GeoCoq angle
congruence has nondegenerate-ray hypotheses that the present declarations do
not supply. Coordinates on the `pt:` line are intentionally discarded and do
not contribute to the theorem's meaning.

Triangle congruence is ordered: `con_tri(t_ABC,t_DEF)` means the correspondence
`A-D`, `B-E`, `C-F`. It comprises the three corresponding side congruences and
the three corresponding angle congruences. SAS, ASA, and AAS also accept cyclic
rotations of that correspondence. Segment notation is unoriented; congruence
may be written with either endpoint order or with its two sides exchanged.
Every declared triangle carries the semantic side condition that its vertices
are noncollinear.

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
parse satisfies the independent `ProblemGrammar`. Parser completeness is useful
but is not needed for soundness because rejecting additional inputs is safe.

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
both against repository proof files. The native command exits zero and prints
`accepted` on acceptance; it exits nonzero and prints `rejected` otherwise.
The Wasm bundle is under
`result/share/ender-checker-wasm/` after the final command.

## Next work

The complete declaration and statement parser, parser-soundness proof, semantic
adapter, and final checker theorem are implemented. Coverage now grows by
mechanizing the remaining reason theorems. Parser completeness is an optional
usability theorem; it is deliberately not assumed by soundness. Every trusted
statement has a total meaning. Binary
`sim_seg` has been replaced by four-segment
`proportion`; linear pairs have explicit ray geometry; `kite_premise` is a
specified compatibility macro; and arcs carry explicit minor/major identity.
