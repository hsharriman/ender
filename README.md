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

Open **ProofObj Harness** from the app to edit proofs live. Verified checker
issues appear in the proof-wide issues list. `enderCheckReport` additionally
returns per-step status, each step's dependencies, the dependency graph with
its unused steps, facts derived twice, and which step reached the goal; the
harness does not render those yet.

### CLI proof checker

Run the checker on one proof file:

```bash
nix develop
npm run checkProof -- src/checker/proofs/examples/tutorial.txt
```

The CLI checker does not require OpenAI/LLM configuration.

### Common proof files

Proof samples live in `src/checker/proofs/`, organized into category subdirectories (`examples/`, `circles/`, `lines_angles/`, `quadrilaterals/`, `triangles/`) — for example: `examples/tutorial.txt`, `examples/tutinc.txt`, `examples/s1c1.txt`, `examples/s2c2.txt`.

### Checker HTTP server

The checker also runs as a standalone HTTP server used by the backend agents:

```bash
npm run checker-server   # starts on http://localhost:4000
```

`POST /check` with body `{ "text": "<proof text>" }` returns the same JSON structure as the CLI.

---

## Docker

Three containers are defined in `docker-compose.yml`:

| Container | Role | Port |
|---|---|---|
| `checker` | Node.js HTTP server wrapping the proof checker | 4000 |
| `backend` | Python/Flask server for the solver and feedback agents | 5000 |
| `interface` | Vite dev server for the React UI | 3000 |

The backend calls the checker via HTTP (`CHECKER_URL=http://checker:4000`). The interface proxies `/api/*` requests to the backend through Vite's dev server proxy.

Both `backend` and `interface` also mount an external, read-only volume named `proof_data` at `/app/geo-proof-dataset`. This volume is a named Docker volume produced by the [`geo-proof-dataset`](../geo-proof-dataset) repo — it is declared here as `external: true`, so it is not created or seeded by this project. It packages that repo's `proofs/` and `wrong_proofs/` folders.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- A `.env` file in the repo root with your OpenAI API key (copy from `.env.example`):

```bash
cp .env.example .env
# then edit .env and set OPENAI_API_KEY
```
- The `proof_data` volume must exist before starting this project. Build and seed it once from the `geo-proof-dataset` repo:

```bash
cd ../geo-proof-dataset
docker compose up proof-data
```

  (See that repo's README for full details. If the volume doesn't exist yet, `docker compose up` here will fail with an error naming the missing external volume.)

#### Running without `geo-proof-dataset`

`geo-proof-dataset` is a private repo, so it isn't available to everyone. If you don't have the `proof_data` volume, use the standalone compose file instead of the default one. It runs the same three services but drops the external volume, so only the proofs bundled in this repo under `src/checker/proofs/` are available (that volume is only used by the manual eval scripts in `backend/`, not by the running services):

```bash
npm run docker:standalone
```

This is a shortcut for `docker compose -f docker-compose.standalone.yml up --build` (builds the images and starts all three services). Everything else below (ports, logs, stop, backend API) works the same — just add `-f docker-compose.standalone.yml` to each `docker compose` command.

### Build

```bash
docker compose build
```

### Start

```bash
docker compose up
```

The interface is available at [http://localhost:3000/ender/](http://localhost:3000/ender/).

To start a specific service only:

```bash
docker compose up checker
docker compose up checker backend
```

### Stop

```bash
docker compose down
```

To also remove built images:

```bash
docker compose down --rmi local
```

### Logs

```bash
docker compose logs -f            # all services
docker compose logs -f backend    # one service
```

### Backend API

Once running, the backend exposes:

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/api/solve` | `{ "proofName": "s1c1", "prompt": "solver_with_valid_reasons_and_explanation" }` | Run the LLM solver on a proof |
| `POST` | `/api/feedback` | `{ "proofName": "s1c1", "solverPrompt": "solver_with_valid_reasons", "feedbackPrompt": "feedback" }` | Get Socratic feedback on a proof |
| `GET` | `/api/health` | — | Health check |

`proofName` must match a file in `src/checker/proofs/` (without the `.txt` extension), including its category subdirectory — for example `examples/s1c1`. The `prompt` fields default to the values shown above if omitted.

---

## Contributing

1. Open a branch with the naming convention `<user-alias>/<description>` (i.e., `hharriman/render-points`)
2. Push your changes to your branch
3. Open a PR to `main`. The first word of your PR title should be one of:
   a. `feat:` A new feature is being added with this PR
   b. `fix:` A fix is implemented in this PR
   c. `chore:` Some utility/devops/upkeep is done
4. In the PR description provide a list of the changes that were made

## Extending the proof language

Ender source is parsed and checked by extracted Rocq code. The TypeScript code
only adapts the presentation AST for rendering.

- Add theorem-bearing syntax and semantics in `rocq/Ender/Audit.v`, and update
  `PublicParser.v`, the verified kernel, and its proof.
- Add display-only syntax in `rocq/Ender/PresentationParser.v`, then update the
  JSON and TypeScript presentation types if its shape changes.
- Update `presentationAdapter.ts` and the geometry/layout code when a new object
  needs to be drawn.
- The files under `src/checker/grammar/defs/` are untrusted prose metadata for
  the theorem browser and solver prompt; they do not determine acceptance.
- Add or update a proof fixture and run `nix flake check -L` and `npm test`.

For verified-reason work, begin with
[`docs/agent-handoff.md`](docs/agent-handoff.md) and the exhaustive
[`docs/reason-coverage.json`](docs/reason-coverage.json) manifest.

### Editing the Rocq sources

Launch the editor from `nix develop`, at the repository root:

```bash
nix develop
code .
```

The dev shell puts a `vsrocqtop` matching this project's Rocq on the `PATH`, and
[VsRocq](https://marketplace.visualstudio.com/items?itemName=rocq-prover.vsrocq)
prefers that over any language server it ships with. This matters because a
language server compiled against a different Rocq release cannot read the `.vo`
files this one produces — it will refuse GeoCoq and even the standard library,
reporting `Cannot find a physical path bound to logical path Ascii` or
`has bad version number`. The shell also exports the `ROCQPATH` that makes
GeoCoq visible, which an editor started outside it will not have.

`_RocqProject` at the repository root supplies the `Ender` load path. Rocq 9's
VsRocq server would also read one placed beside the sources, searching upward
from the file being edited, but the root is where a server started in the
workspace directory finds it either way.

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
