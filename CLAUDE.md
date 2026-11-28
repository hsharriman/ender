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
nix develop -c npm run deploy      # Rebuild the Wasm checker, build, publish to gh-pages
```

Run tests in watch mode: `npm test -- --watch`

Docker (see README for full docs):

```bash
docker compose build && docker compose up   # build and start all three services
docker compose down                         # stop
```

## Code Style

- In TypeScript, always define functions as arrow functions
  (`const f = (x: T): R => ...`), never with the `function` keyword. Older
  code still uses `function`; write new and rewritten code as arrows.
- Name things for what they are in the proof language. A reason is always a
  reason (`Reason`, `reason`), a statement always a statement or stmt
  (`Stmt`, `stmt`), and a geometric object a `ParseObj`. Never use a generic
  word such as "call" or "term" for either, even where they share the
  `name(args)` shape. Use the existing types in
  `src/checker/types/checkerTypes.ts`; parse object names once with
  `parseObject` (`src/checker/grammar/syntax.ts`) and pass `ParseObj`s, not
  name strings. Write text back only at the checker boundary, with
  `stmtText`, `reasonText`, and `objectName`.

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
`rocq/Ghost/Audit.v`. The catalogs must still list exactly what the kernel
accepts, because `backend/solver_agent.py` pastes both files, comments and all,
into the solver's prompt as the reasons and statements it may use.

Diagnoses of what a rejected step was missing live in TypeScript
(`src/interface/core/diagnosis/`), not in `rocq/`. They are advice, not
checking: they get every judgement from the kernel through a checker session
(`openCheckerSession`), which answers whether a candidate step would be
accepted, which templates a reason is checked against, and whether a
statement matches a template statement. Keep search and ranking out of the
Rocq checker; add a session primitive only when a diagnosis needs a
judgement the kernel alone can make.
`diagnoseSteps` (`diagnosis/steps.ts`) searches each rejected step in a fixed
order, stopping at the first accepted edit: one citation changed, then one
conclusion object changed, then deeper citation searches (template readings,
two citations). Every rejected step is searched the same way, whatever its
issue code or note.

Most reasons are given in the kernel as templates rather than hand-written
rules: `reason_needs` (`rocq/Ghost/Checker.v`) lists, for a conclusion, the
statements each cited step must match and how each is compared (a
`Matcher`), and `rule_valid` accepts a step when its citations match one
template. Template readings (`diagnosis/criteria.ts`) grade the same
templates, read through `session.needs`, so diagnosis and checking cannot
disagree. To add or change such a reason, edit its `*_needs` function and
its `*_needs_sound` lemma; a reason whose citations depend on each other
(transitivity, the forward quadrilateral rules) keeps a rule of its own in
`bespoke_rule_valid`.

**Key types** (defined in `src/checker/types/checkerTypes.ts` and `src/geometry-object/types/types.ts`):

- `Stmt` = `{ function: string; arguments: ParseObj[] }` — a statement like `con_seg(AB, CD)`
- `Reason` = `{ function: string; arguments: string[] }` — a reason like `sas([01], [02], [03])`
- `ParseObj` = `{ type: Obj.*; v: string }` — a geometric object (point, segment, angle, triangle, quad, circle)
- `ProofObj` — presentation/layout model for premises and proof rows
- `ProofContent` — display geometry: the figure's objects and how each is
  drawn in every frame (modes and ticks live on the objects). Built by
  `presentationContent`, once per layer of a walkthrough. Angles are merged
  through the checker's ray representatives (the report's `rays`), so the
  figure treats two spellings as one angle exactly when the checker does

**Backend agents** (`backend/`): Python scripts using `litellm`. `solver_agent.py` iteratively fixes broken proofs (up to 5 LLM loops); `feedback_agent.py` compares student proof to LLM solution for feedback. Prompt templates in `backend/prompt/`.

## Extending the Grammar

Change theorem syntax, semantics, and checking in Rocq. Change the presentation
parser and TypeScript adapter when display syntax changes. See `README.md` for
the concise checklist. Unsupported reasons must fail closed.

Any change to the Rocq checker that adds, removes, renames, or changes what a
reason or statement accepts must update the catalogs in the same change:

- `src/checker/grammar/defs/reasons.defs.ts` holds one entry per reason in
  `reason_arities` (`rocq/Ghost/CompleteChecker.v`), and no others. Each
  entry's `dependencies` lists, in citation order, the statements the rule in
  `rocq/Ghost/Checker.v` matches (a group from `stmts.defs.ts` only when the
  rule accepts every member), and `conclusions` the statements it can prove.
  Entries are checked against `ReasonDef` (`src/checker/grammar/catalog.ts`).
  Leave out reasons with no rule rather than listing them.
- `src/checker/grammar/defs/stmts.defs.ts` holds one entry per statement
  `rocq/Ghost/PublicParser.v` parses, with the same parameters in the same
  order. Mark `isPremisesOnly` only when no reason concludes it.
- Add the reason's hint row, and any new issue code, to
  `src/checker/ERROR_CODES.md`.
- Keep stale or speculative entries out, including commented-out ones: the
  solver reads the raw file.

Rerun `make -C rocq` after any `rocq/` edit; the TypeScript side loads the
artifacts in `rocq/_build/`, so an unbuilt edit has no effect on anything but
the Rocq files.

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

A step line that does not parse (empty, cut off, a misspelled reason) is
skipped as `incomplete` rather than rejecting the proof: it keeps its number,
proves nothing, and blocks any step that cites it, and the proof is accepted
if the readable steps prove the goal. A malformed line still rejects the
proof: one without a step number `[n]` (`n` all digits), one with a character
other than letters, digits, spaces, and `_ ( ) , - >`, a whole step missing
its `->`, or a whole statement followed by more text.

The diagram draws only what the premises make: declared objects and the
segments premises such as `on_line` or `intersect_seg` imply. A step or the
goal never adds a segment; a segment it names must be declared on a `seg:`
line (or be a side of a declared triangle or quadrilateral) to be drawn. A
step may mark an angle, triangle, or quadrilateral the premises only imply,
when all its sides are drawn.

`on_line(AB, P)` places P strictly inside AB: never at A or B. A point at an
end of a segment needs no `on_line`; it is already named by the segment.

An angle may be named through any point on each of its rays: with
`[d_n] on_line(PR, T)`, `a_QPT` and `a_QPR` are the same angle, in any step,
citation, or the goal. Premises place points on rays (`statement_ray_segments`
in `rocq/Ghost/Checker.v`): `on_line`, `intersect_seg`, and `transversal`
place each named point strictly inside its segments, so their points never
need a declaration. `midpt`, `seg_bisect`, and `perp_bisector` place the
midpoint on the segment they halve, strictly once that segment is declared
(a `seg:` line, or two corners of a declared triangle or quadrilateral);
otherwise each renamed point must be declared apart from the vertex. A
bisector only meets its own line, so naming a ray along the bisector needs an
`on_line`. Only premises place points; derived facts never do. The kernel compares angles
through a canonical spelling (`canonical_statement` in
`rocq/Ghost/Checker.v`) used only for checking; proofs, reports, and the
interface keep the spelling as written. `ref_ang`, `linear_pair`, and
`inscribed_angle` are compared as written.

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

An arc is named `r_OAB`, the minor arc AB of the circle centred at O; there
is no major-arc form. Declare arcs on an `arc:` line (`arc: r_OAB r_OCD`)
before a premise or the goal names them. The checker rejects the proof unless
exactly one declared circle is centred at O, A and B are distinct points other
than O that the circle's name or a premise puts on it, and no `diameter`
premise names AB.
