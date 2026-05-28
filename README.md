# Ender

## Run the Project

### Prerequisites

- Node.js 23+
- npm

Install dependencies once:

```bash
npm install
```

### Interface (React app)

```bash
npm start
```

This starts the UI at [http://localhost:3000/ender/](http://localhost:3000/ender/) (the dev server redirects `/` to `/ender/`).

Open **ProofObj Harness** from the app to edit proofs live; checker errors appear in the editor (red lines and hover tooltips) and in the proof-wide issues list.

### CLI proof checker

Run the checker on one proof file:

```bash
npm run checkProof -- src/checker/proofs/tutorial.txt
```

The CLI checker does not require OpenAI/LLM configuration.

### Common proof files

Proof samples live in `src/checker/proofs/` (for example: `tutorial.txt`, `tutinc.txt`, `s1c1.txt`, `s2c2.txt`).

## Contributing

1. Open a branch with the naming convention `<user-alias>/<description>` (i.e., `hharriman/render-points`)
2. Push your changes to your branch
3. Open a PR to `main`. The first word of your PR title should be one of:
   a. `feat:` A new feature is being added with this PR
   b. `fix:` A fix is implemented in this PR
   c. `chore:` Some utility/devops/upkeep is done
4. In the PR description provide a list of the changes that were made

## Extending the proof grammar (objects, statements, reasons)

Proofs are text files parsed into a `ProofObj`, checked by `src/checker/proofChecker.ts`, and rendered from that same object in the React interface. A change usually touches **(1) tokenization and parsing**, **(2) type definitions and checker logic**, and **(3) UI text and diagram behavior**. The tables below list the main files for each kind of change.

**Conceptual pipeline**

- **Lexer** (`src/checker/grammar/parser.ts`) turns source text into tokens (points, `t_ABC`, keywords like `tri:`, `stmt` names, step refs `[01]`, etc.).
- **Parser** (`src/checker/grammar/lezerParser.ts`) builds `ProofObj` (premises, goal, steps with `Reason` + `Stmt`).
- **Definitions** — statement shapes live in `src/checker/grammar/defs/stmts.defs.ts`; reason shapes in `src/checker/grammar/defs/reasons.defs.ts`. Human-readable mirrors `stmts.txt` / `reasons.txt` are **not** the source of truth (see comments in those files); update the `.defs.ts` files.
- **Checker** uses definition maps + `src/checker/checker/graph.ts`, `validators.ts`, and `reasonApplication.ts` (plus `reasonChecks/` for geometric checks).
- **Interface** uses `src/interface/core/grammarToLayout/proofObjLayout.ts` and helpers like `proofObjText.tsx`, `proofObjObjectApplication.ts`, and `proofObjBaseContent.ts`.

**Types to know**

- `Stmt` = `{ function: string; arguments: ParseObj[] }` (`src/checker/types/checkerTypes.ts`).
- `ParseObj` = `{ type: Obj.*; v: string }` (`src/geometry-object/types/types.ts`). The lexer + `ProofParser.parseObj` decide how source spellings map to `Obj` and stored `v` (often stripping prefixes like `t_` / `a_` for checks).

---

### 1. Add a new geometric **object** type (example: `circle`)

Use this when you introduce a new kind of literal in proofs (new premise section, new statement argument shape, and usually new diagram behavior).

| Area                                 | What to change                                                                                                                                                                                                                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tokenization**                     | `src/checker/grammar/parser.ts` — add a `moo` rule for the literal (put **longer** patterns before shorter ones so they are not swallowed). If you add a named premises list (like `tri:`), add a keyword token and a section label (e.g. `circ:`).                                                                      |
| **AST / `ProofObj` premises**        | `src/checker/types/checkerTypes.ts` — extend `premises` (e.g. add `circles: ParseObj[]`) if circles are listed in the premises block.                                                                                                                                                                                    |
| **Object model**                     | `src/geometry-object/types/types.ts` — add a value to `Obj` and extend the `ParseObj` union. Implement a geometry class if the diagram needs it (see `geometry-object/geometry/*`, `ProofContent` / `DiagramContent`).                                                                                                   |
| **Parser**                           | `src/checker/grammar/lezerParser.ts` — `parseObj`, `geomPremiseTokenTypes`, `assertPremiseListHead`, the `premises` loop (new branch like `tri` / `quad`), `parseStatement` (if the lexer emits a new token type for literals inside `stmt(...)`), plus validators like `validateTriangleToken` for your spelling rules. |
| **Normalization**                    | `src/checker/normalizeProofObj.ts` — strip or canonicalize prefixes on objects if you use them in proofs.                                                                                                                                                                                                                |
| **Well-formedness**                  | `src/checker/checker/validators.ts` — `checkGeometricObjects`: add a `switch` case for the new `Obj` (point sets, duplicate letters, etc.).                                                                                                                                                                              |
| **Semantic premises / diagram seed** | `src/checker/checker/premises.ts` — only if givens or diagram premises must update geometric context (often `switch` on `statement.function`).                                                                                                                                                                           |
| **Reason machinery**                 | `src/checker/checker/reasonApplication.ts` — `getGeometricObject` must support your `Obj` if any reason pulls live geometry from `ProofContent`.                                                                                                                                                                         |
| **Interface: diagram**               | `src/interface/core/grammarToLayout/proofObjBaseContent.ts` — seed `DiagramContent` from the new premise list. Add drawing helpers under `src/interface/core/` as needed.                                                                                                                                                |
| **Docs / samples**                   | `src/checker/glossary.md`, `src/checker/README.md`, and a proof under `src/checker/proofs/` that exercises the new syntax.                                                                                                                                                                                               |

---

### 2. Add a new **statement** (example: `sim_tri(t_ABC, t_DEF)`)

Many statements only combine existing object kinds (segments, angles, triangles, …). The project already defines `sim_tri` with two triangle arguments in `stmts.defs.ts`; the checklist below is what you would repeat for a **new** statement name.

| Area                         | What to change                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Definition (required)**    | `src/checker/grammar/defs/stmts.defs.ts` — add an entry under `statements`: `name`, `parameters` (human-readable labels like today’s `triangle("t1")`), optional `isPremisesOnly`, optional `group` for substitute-able statements (see `congruent_angs`). Optionally mirror in `src/checker/grammar/defs/stmts.txt` for readers (**deprecated** file). |
| **Object kinds**             | If parameters use only existing `ParseObj` types, nothing else is required in `geometry-object`. If you need a **new** parameter type (e.g. a circle), complete **section 1** first.                                                                                                                                                                    |
| **Parser**                   | Usually no change if statement arguments are already valid `parseObj` inputs. If you add a new token type, update `lezerParser.ts` in the statement-argument loop.                                                                                                                                                                                      |
| **Checker**                  | `checkStatementArguments` in `src/checker/checker/validators.ts` currently checks **arity** against `stmts.defs`. Graph building in `src/checker/checker/graph.ts` uses statement defs for step validity. Add **domain checks** in `reasonChecks/` or `validators` if you need more than arity.                                                         |
| **Given / diagram premises** | If the statement can appear in givens and affects the built diagram, extend `src/checker/checker/premises.ts` (and the same for `proof.premises.diagramStatements`).                                                                                                                                                                                    |
| **Interface: text**          | `src/interface/core/grammarToLayout/proofObjText.tsx` — add a branch in `stmtToText` (or the step falls back to `function(arg1, arg2, …)` plain text).                                                                                                                                                                                                  |
| **Interface: diagram**       | `src/interface/core/grammarToLayout/proofObjObjectApplication.ts` — in `createStmtObjectApplier`, map the new `stmt.function` to tick marks, labels, or overlays (see `con_seg`, `con_ang`, `con_tri`). If you need congruence-style tick tracking, extend `buildCongruenceTickTracker`.                                                                |
| **Layout**                   | `src/interface/core/grammarToLayout/proofObjLayout.ts` — only if the new statement needs special transversal/vertical-angle style behavior (rare; most changes stay in `proofObjObjectApplication.ts`).                                                                                                                                                 |

---

### 3. Add a new **reason** (example: `corr_ang([01],[02]) -> con_ang(...)`)

Reasons tie dependency step numbers to a conclusion statement. They are listed in `reasons.defs.ts` and checked in `reasonApplication.ts`.

| Area                          | What to change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Definition (required)**     | `src/checker/grammar/defs/reasons.defs.ts` — add a key (lowercase function name used in proof text). Set `dependencies` to statement names or **groups** from `stmts.defs` (see `ReasonDefinition`). Use `diagramDependencies` when refs come from diagram premises instead of step lists. Set `conclusion` to the statement name(s) allowed for this reason — comma-separated if multiple (see existing entries). Optionally mirror `src/checker/grammar/defs/reasons.txt` (**not** source of truth). |
| **Collision with statements** | `lezerParser.ts` — `parseStatement` rejects names that are **only** reasons; keep names consistent with defs.                                                                                                                                                                                                                                                                                                                                                                                          |
| **Structural checks**         | `src/checker/checker/validators.ts` — reason/step shape and dependency typing vs defs (already wired through the graph).                                                                                                                                                                                                                                                                                                                                                                               |
| **Geometric / logical check** | `src/checker/checker/reasonApplication.ts` — add a `case "your_reason":` that calls helpers in `src/checker/checker/reasonChecks/`. If you omit this, unknown reasons fall through to `default` and **return `true`** after syntax passes (placeholder behavior).                                                                                                                                                                                                                                      |
| **Interface: theorem panel**  | `src/interface/theorems/reasons.ts` — extend `reasonFromFunction`’s map so the step shows a proper title/body; otherwise the UI shows the raw function name. Add a `Reasons.YourReason` entry with `title` / `body` / optional `src` for assets. `expectedDependenciesDescription` is filled automatically from `reasons.defs` when possible.                                                                                                                                                          |
| **Interface: highlights**     | Optional: add a small helper under `src/interface/core/reasons/` (like `Transversal.tsx`) and hook it from `proofObjLayout.ts` if the step needs custom diagram emphasis.                                                                                                                                                                                                                                                                                                                              |

---

### Quick “did I forget anything?” checklist

- [ ] Definitions updated in **`stmts.defs.ts`** and/or **`reasons.defs.ts`**
- [ ] Parser accepts new tokens / premise sections (**`parser.ts`**, **`lezerParser.ts`**)
- [ ] **`ParseObj` / `ProofObj`** extended if premises or args introduced a new object kind
- [ ] **`validators.ts`** (objects) and **`reasonApplication.ts`** (reason semantic check, or accept placeholder `default`)
- [ ] **`proofObjText.tsx`** and **`proofObjObjectApplication.ts`** for readable text and diagram updates
- [ ] Sample proof in **`src/checker/proofs/`** and **`npm run checkProof`** on it

## Build tool (Vite)

The web interface is built with [Vite](https://vitejs.dev/). `vite.config.ts` sets `base: "/ender/"` for GitHub Pages.

## Available scripts

| Command                          | Description                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| `npm start`                      | Dev server (port 3000, app at `/ender/`)                                           |
| `npm run build`                  | Typecheck with `tsc` and production build to `dist/`                               |
| `npm run preview`                | Serve the `dist/` build locally                                                    |
| `npm test` / `npm run test-core` | Run [Jest](https://jestjs.io/) (see `jest.config.js`)                              |
| `npm run deploy`                 | Build and publish `dist/` to the `gh-pages` branch (see `package.json` `homepage`) |
