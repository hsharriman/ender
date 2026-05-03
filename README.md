# Ender

## Run the Project

### Prerequisites

- Node.js 18+ (recommended)
- npm

Install dependencies once (there will be many critical dependency errors caused by create-react-app, I'm sorry):

```bash
npm install
```

### Interface (React app)

#### Run with LLM feedback enabled (FOLLOW THESE FOR THE HUMAN-AI INTERACTION FINAL PROJECT)

The browser harness expects `REACT_APP_OPENAI_API_KEY` (Create React App only exposes `REACT_APP_*` vars to browser code).

Option A (recommended for this repo): put your key in `src/llm-feedback/.env`:

```bash
REACT_APP_OPENAI_API_KEY=your_key_here
```

Then run:

```bash
npm run start:with-llm-env
```

Option B: set `REACT_APP_OPENAI_API_KEY` in your shell (or a CRA env file like `.env.local`) and run `npm start`.

#### LLM feedback walkthrough (Harness)

1. Start the app with LLM enabled (`npm run start:with-llm-env`).
2. Open [http://localhost:3000](http://localhost:3000).
3. Click the `Harness` button to open `ProofObjHarness`.
4. Click the `Show Editor` button (top-right) to open the proof selector/editor.
5. Use the proof dropdown to switch examples:
   - files with an `inc` suffix include an intentional mistake
   - files with an `incomplete` suffix are missing steps
6. LLM feedback appears for incorrect/incomplete proofs in the step feedback panel.

#### Run without LLM feedback

```bash
npm start
```

This starts the UI at [http://localhost:3000](http://localhost:3000).

### CLI proof checker

Run the checker on one proof file:

```bash
npm run checkProof -- src/checker/proofs/tutorial.txt
```

Run debug checker:

```bash
npm run debugProof -- src/checker/proofs/tutorial.txt
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

| Area | What to change |
| --- | --- |
| **Tokenization** | `src/checker/grammar/parser.ts` — add a `moo` rule for the literal (put **longer** patterns before shorter ones so they are not swallowed). If you add a named premises list (like `tri:`), add a keyword token and a section label (e.g. `circ:`). |
| **AST / `ProofObj` premises** | `src/checker/types/checkerTypes.ts` — extend `premises` (e.g. add `circles: ParseObj[]`) if circles are listed in the premises block. |
| **Object model** | `src/geometry-object/types/types.ts` — add a value to `Obj` and extend the `ParseObj` union. Implement a geometry class if the diagram needs it (see `geometry-object/geometry/*`, `ProofContent` / `DiagramContent`). |
| **Parser** | `src/checker/grammar/lezerParser.ts` — `parseObj`, `geomPremiseTokenTypes`, `assertPremiseListHead`, the `premises` loop (new branch like `tri` / `quad`), `parseStatement` (if the lexer emits a new token type for literals inside `stmt(...)`), plus validators like `validateTriangleToken` for your spelling rules. |
| **Normalization** | `src/checker/normalizeProofObj.ts` — strip or canonicalize prefixes on objects if you use them in proofs. |
| **Well-formedness** | `src/checker/checker/validators.ts` — `checkGeometricObjects`: add a `switch` case for the new `Obj` (point sets, duplicate letters, etc.). |
| **Semantic premises / diagram seed** | `src/checker/checker/premises.ts` — only if givens or diagram premises must update geometric context (often `switch` on `statement.function`). |
| **Reason machinery** | `src/checker/checker/reasonApplication.ts` — `getGeometricObject` must support your `Obj` if any reason pulls live geometry from `ProofContent`. |
| **Interface: diagram** | `src/interface/core/grammarToLayout/proofObjBaseContent.ts` — seed `DiagramContent` from the new premise list. Add drawing helpers under `src/interface/core/` as needed. |
| **Docs / samples** | `src/checker/glossary.md`, `src/checker/README.md`, and a proof under `src/checker/proofs/` that exercises the new syntax. |

---

### 2. Add a new **statement** (example: `sim_tri(t_ABC, t_DEF)`)

Many statements only combine existing object kinds (segments, angles, triangles, …). The project already defines `sim_tri` with two triangle arguments in `stmts.defs.ts`; the checklist below is what you would repeat for a **new** statement name.

| Area | What to change |
| --- | --- |
| **Definition (required)** | `src/checker/grammar/defs/stmts.defs.ts` — add an entry under `statements`: `name`, `parameters` (human-readable labels like today’s `triangle("t1")`), optional `isPremisesOnly`, optional `group` for substitute-able statements (see `congruent_angs`). Optionally mirror in `src/checker/grammar/defs/stmts.txt` for readers (**deprecated** file). |
| **Object kinds** | If parameters use only existing `ParseObj` types, nothing else is required in `geometry-object`. If you need a **new** parameter type (e.g. a circle), complete **section 1** first. |
| **Parser** | Usually no change if statement arguments are already valid `parseObj` inputs. If you add a new token type, update `lezerParser.ts` in the statement-argument loop. |
| **Checker** | `checkStatementArguments` in `src/checker/checker/validators.ts` currently checks **arity** against `stmts.defs`. Graph building in `src/checker/checker/graph.ts` uses statement defs for step validity. Add **domain checks** in `reasonChecks/` or `validators` if you need more than arity. |
| **Given / diagram premises** | If the statement can appear in givens and affects the built diagram, extend `src/checker/checker/premises.ts` (and the same for `proof.premises.diagramStatements`). |
| **Interface: text** | `src/interface/core/grammarToLayout/proofObjText.tsx` — add a branch in `stmtToText` (or the step falls back to `function(arg1, arg2, …)` plain text). |
| **Interface: diagram** | `src/interface/core/grammarToLayout/proofObjObjectApplication.ts` — in `createStmtObjectApplier`, map the new `stmt.function` to tick marks, labels, or overlays (see `con_seg`, `con_ang`, `con_tri`). If you need congruence-style tick tracking, extend `buildCongruenceTickTracker`. |
| **Layout** | `src/interface/core/grammarToLayout/proofObjLayout.ts` — only if the new statement needs special transversal/vertical-angle style behavior (rare; most changes stay in `proofObjObjectApplication.ts`). |

---

### 3. Add a new **reason** (example: `corr_ang([01],[02]) -> con_ang(...)`)

Reasons tie dependency step numbers to a conclusion statement. They are listed in `reasons.defs.ts` and checked in `reasonApplication.ts`.

| Area | What to change |
| --- | --- |
| **Definition (required)** | `src/checker/grammar/defs/reasons.defs.ts` — add a key (lowercase function name used in proof text). Set `dependencies` to statement names or **groups** from `stmts.defs` (see `ReasonDefinition`). Use `diagramDependencies` when refs come from diagram premises instead of step lists. Set `conclusion` to the statement name(s) allowed for this reason — comma-separated if multiple (see existing entries). Optionally mirror `src/checker/grammar/defs/reasons.txt` (**not** source of truth). |
| **Collision with statements** | `lezerParser.ts` — `parseStatement` rejects names that are **only** reasons; keep names consistent with defs. |
| **Structural checks** | `src/checker/checker/validators.ts` — reason/step shape and dependency typing vs defs (already wired through the graph). |
| **Geometric / logical check** | `src/checker/checker/reasonApplication.ts` — add a `case "your_reason":` that calls helpers in `src/checker/checker/reasonChecks/`. If you omit this, unknown reasons fall through to `default` and **return `true`** after syntax passes (placeholder behavior). |
| **Interface: theorem panel** | `src/interface/theorems/reasons.ts` — extend `reasonFromFunction`’s map so the step shows a proper title/body; otherwise the UI shows the raw function name. Add a `Reasons.YourReason` entry with `title` / `body` / optional `src` for assets. `expectedDependenciesDescription` is filled automatically from `reasons.defs` when possible. |
| **Interface: highlights** | Optional: add a small helper under `src/interface/core/reasons/` (like `Transversal.tsx`) and hook it from `proofObjLayout.ts` if the step needs custom diagram emphasis. |

---

### Quick “did I forget anything?” checklist

- [ ] Definitions updated in **`stmts.defs.ts`** and/or **`reasons.defs.ts`**
- [ ] Parser accepts new tokens / premise sections (**`parser.ts`**, **`lezerParser.ts`**)
- [ ] **`ParseObj` / `ProofObj`** extended if premises or args introduced a new object kind
- [ ] **`validators.ts`** (objects) and **`reasonApplication.ts`** (reason semantic check, or accept placeholder `default`)
- [ ] **`proofObjText.tsx`** and **`proofObjObjectApplication.ts`** for readable text and diagram updates
- [ ] Sample proof in **`src/checker/proofs/`** and **`npm run checkProof`** on it

## CRA Reference

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
