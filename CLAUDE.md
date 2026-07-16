# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start                          # Dev server at http://localhost:3000/ender/
npm run build                      # tsc typecheck + Vite production build to dist/
npm test                           # Run Jest tests (single file: src/checker/test/proofTests.test.ts)
npm run checkProof -- <file>       # CLI: check a proof file
npm run checker-server             # HTTP checker service on port 4000 (used by Docker backend)
npm run debugProof -- <file>       # CLI: debug with detailed output
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

1. **Lexer** (`src/checker/grammar/parser.ts`) — `moo` rules tokenize source into points, prefixed objects (`t_ABC`), keywords, step refs (`[01]`)
2. **Parser** (`src/checker/grammar/lezerParser.ts`) — builds `ProofObj` (premises, goal, steps with `Reason` + `Stmt`)
3. **Definitions** — statement shapes in `src/checker/grammar/defs/stmts.defs.ts`; reason shapes in `reasons.defs.ts` — these `.defs.ts` files are the source of truth (the `.txt` mirrors are not)
4. **Checker** (`src/checker/proofChecker.ts`) — builds geometry (`ProofContent`), constructs dependency graph (`graph.ts`), validates (`validators.ts`), checks reason logic (`reasonApplication.ts` + `reasonChecks/`)
5. **Interface** — `src/interface/core/grammarToLayout/` converts `ProofObj` to readable text (`proofObjText.tsx`), SVG diagrams (`diagramSvg/`), and congruence tick marks (`proofObjObjectApplication.ts`)

**Key types** (defined in `src/checker/types/checkerTypes.ts` and `src/geometry-object/types/types.ts`):
- `Stmt` = `{ function: string; arguments: ParseObj[] }` — a statement like `con_seg(AB, CD)`
- `Reason` = `{ function: string; arguments: string[] }` — a reason like `sas([01], [02], [03])`
- `ParseObj` = `{ type: Obj.*; v: string }` — a geometric object (point, segment, angle, triangle, quad, circle)
- `ProofObj` — full proof: premises (objects, givens), steps (proof/goal), errors
- `ProofGraph` — nodes (steps), edges (dependencies), incorrectSteps, unusedSteps, cycles
- `ProofContent` — built geometry: point coordinates, segment vectors, angle geometry

**Backend agents** (`backend/`): Python scripts using `litellm`. `solver_agent.py` iteratively fixes broken proofs (up to 5 LLM loops); `feedback_agent.py` compares student proof to LLM solution for feedback. Prompt templates in `backend/prompt/`.

## Extending the Grammar

Any grammar change typically touches three areas: **(1) tokenization/parsing**, **(2) definitions + checker logic**, **(3) UI text and diagram**. See `README.md` for full per-file checklists. Key files per layer:

| Layer | Files |
|---|---|
| Tokenization | `parser.ts` (moo rules — longer patterns first!), `lezerParser.ts` |
| Types | `checkerTypes.ts`, `geometry-object/types/types.ts` |
| Definitions | `stmts.defs.ts`, `reasons.defs.ts` |
| Validation | `validators.ts`, `reasonApplication.ts`, `reasonChecks/` |
| UI text | `proofObjText.tsx` |
| UI diagram | `proofObjDiagramAdditions.ts`, `diagramSvg/` |

Unknown reasons fall through to a `default: return true` in `reasonApplication.ts` — omitting a geometric check is valid placeholder behavior during development.

## Error Codes

`src/checker/ERROR_CODES.md` maps every error code (the `code` field on `ErrorDetails`) to a description of the boolean check that triggers it. When changing code in `src/checker/checker/` or `src/checker/grammar/` — adding, removing, renaming, or changing the trigger conditions of an error code — update `src/checker/ERROR_CODES.md` to match.

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

Sample proofs in `src/checker/proofs/` (e.g., `tutorial.txt`, `s1c1.txt`).
