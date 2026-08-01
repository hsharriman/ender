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

[Parser.v](../rocq/Ender/Parser.v) is the principal human-audit boundary. Its
`parse_problem` maps source text to the syntax in
[Syntax.v](../rocq/Ender/Syntax.v), `check_source` is the executable Boolean
entry point, and `check_source_sound` states:

```text
parse_problem source = Some p
and check_source source = true
and p's triangle declarations are noncollinear
and p's premises hold
imply p's goal holds.
```

[Semantics.v](../rocq/Ender/Semantics.v) gives each supported statement its
geometric meaning. The checker implementation and proof are in
[Checker.v](../rocq/Ender/Checker.v). Successfully checking those files proves
the Boolean checker's soundness relative to the parser and statement semantics;
it cannot prove that these intentionally chosen interpretations match a
reader's intent. Those definitions therefore remain part of the human audit.

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
