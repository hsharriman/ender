# Verified checker vertical slice

This directory contains an executable, proved-sound checker for a deliberately
small Ender language.  It is a feasibility result, not yet a replacement for
the TypeScript checker.

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
no Ender implementation file and contains only:

1. `problemPart`, which returns the substring after the `pt:` line and before
   `steps:`;
2. the complete grammar and geometric meaning of the supported statements;
3. the signatures of the problem-part parser and Boolean checker; and
4. the exact `sound` proposition that their implementation must prove.

That proposition states:

```text
problemPart source = Some part
and parseProblemPart part = Some header
and check source = true
imply that, in every supported Tarski geometry and point interpretation,
the header's declared noncollinearity and premises imply its goal.
```

[Parser.v](../rocq/Ender/Parser.v) packages the executable implementation as a
Rocq module constrained by that signature. Its `audit_sound` proof is outside
the audit surface. [Syntax.v](../rocq/Ender/Syntax.v) now contains only Boolean
equality machinery, while [Semantics.v](../rocq/Ender/Semantics.v) contains only
compatibility aliases to the meanings in `Audit.v`. The checker cannot compile
as `VerifiedChecker` unless its functions and proof have exactly the audited
types. Rocq cannot establish that these intentionally chosen meanings match a
reader's intent; this is why those meanings are kept in the audit file.

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

Extending this to all of Ender requires adding its remaining declarations,
statement meanings, parser productions, and reason theorems. The provisional
choices above are intentionally localized in syntax, semantics, and individual
rules, so most can be revised without changing the soundness architecture.
