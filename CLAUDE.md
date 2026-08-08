# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
make -C rocq                       # Build the verified checker into rocq/_build/ (needed first)
npm start                          # Dev server at http://localhost:3000/ender/
npm run build                      # tsc typecheck + Vite production build to dist/
npm test                           # Run Jest tests (single file: src/checker/test/proofTests.test.ts)
npm run checkProof -- <file>       # CLI: check a proof file
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
