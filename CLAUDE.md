# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
nix develop -c make -C rocq        # Build the verified checker into rocq/_build/ (needed first)
npm start                          # Dev server at http://localhost:3000/ender/
npm run build                      # tsc typecheck + Vite production build to dist/
npm test                           # Run Jest tests (single file: src/checker/test/proofTests.test.ts)
npm run checkProof -- <file>       # CLI: check a proof file
npm run scanProofs -- <dir>        # CLI: check every proof under a directory
npm run checker-server             # HTTP checker service on port 4000 (used by Docker backend)
npm run deploy                     # Build and publish to gh-pages
```

Run tests in watch mode: `npm test -- --watch`

Docker (see README for full docs):

```bash
docker compose build && docker compose up   # build and start all three services
docker compose down                         # stop
```

## Architecture

Ender is a geometric proof checker with a React frontend and Python LLM backend agents.

**Processing pipeline** (text → validation → UI):

1. Extracted Rocq parses the theorem-bearing problem and checks the proof.
2. Extracted Rocq separately parses a display-only presentation AST.
3. `src/checker/verified/` loads those functions in Node or the browser.
4. A TypeScript adapter converts presentation data to the legacy `ProofObj`
   layout model; it does not determine acceptance.
5. `src/interface/core/grammarToLayout/` renders text and SVG diagrams.

The catalogs in `src/checker/grammar/defs/` are untrusted UI and solver-prompt
metadata, not executable checking rules. The audited contract is
`rocq/Ender/Audit.v`.

**Key types** (defined in `src/checker/types/checkerTypes.ts` and `src/geometry-object/types/types.ts`):

- `Stmt` = `{ function: string; arguments: ParseObj[] }` — a statement like `con_seg(AB, CD)`
- `Reason` = `{ function: string; arguments: string[] }` — a reason like `sas([01], [02], [03])`
- `ParseObj` = `{ type: Obj.*; v: string }` — a geometric object (point, segment, angle, triangle, quad, circle)
- `ProofObj` — presentation/layout model for premises and proof rows
- `ProofContent` — display geometry: coordinates, segments, and angles

**Backend agents** (`backend/`): Python scripts using `litellm`. `solver_agent.py` iteratively fixes broken proofs (up to 5 LLM loops); `feedback_agent.py` compares student proof to LLM solution for feedback. Prompt templates in `backend/prompt/`.

## Extending the Grammar

Change theorem syntax, semantics, and checking in Rocq. Change the presentation
parser and TypeScript adapter when display syntax changes. See `README.md` for
the concise checklist. Unsupported reasons must fail closed. Rerun `make -C rocq`
after any `rocq/` edit; the TypeScript side loads the artifacts in
`rocq/_build/`, so an unbuilt edit has no effect on anything but the Rocq files.

## Proof File Format

```
title: "Proof Title"
premises:
pt: A, B, C
seg: AB
tri: t_ABC
[d_01] stmt(args)   # diagram statement
[g_1] stmt(args)    # given statement
-> goal_stmt()      # proof goal

steps:
[01] reason(deps) -> stmt(args)
```

Sample proofs in `src/checker/proofs/`, organized into category subdirectories (e.g., `examples/tutorial.txt`, `examples/s1c1.txt`).

Triangle congruence in premises uses `con_tri_ordered`, not `con_tri`. The
vertex order states the correspondence, so `con_tri_ordered(t_ABC, t_DEF)`
pairs A with D, B with E, and C with F. A `con_tri` step gets its
correspondence from the reason that proved it, so only premises need the
ordered form. Proof goals still use `con_tri`.

A quadrilateral is declared once, as `quad: q_ABCD`, and may then be named by
any rotation or reversal of those four letters (`q_BCDA`, `q_DCBA`, ...). The
other orders name a different, self-crossing figure, so they do not refer to
the declared quadrilateral.

The inscribed-angle rules (`con_inscribed_angs`, `supp_inscribed_angs`,
`inscribed_semi`) need a `[d_n] circ_order(c_OA, A, B, C, ...)` premise that
lists every point on the circle in the order met going round it, from any
start and in either direction. `inscribed_angle(c_OA, a_XPY)` puts only the
vertex P on the circle; X and Y may be any points along rays that reach a
listed point.
