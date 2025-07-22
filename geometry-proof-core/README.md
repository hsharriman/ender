# geometry-proof-core

This module contains the core logic, grammar, and Lean code generation for the Euclidean geometry proof system. It is designed to be used independently from any frontend (such as a React app).

## Folder Structure

- `grammar/` — Lezer grammar, parser, and related TypeScript utilities
- `lean/` — Lean4 code, TypeScript scripts for Lean code generation, and helpers
- `package.json` — Module/package configuration
- `tsconfig.json` — TypeScript configuration

## Prerequisites

- [Node.js](https://nodejs.org/) (v14+ recommended)
- [TypeScript](https://www.typescriptlang.org/) (`npm install -g typescript` or use `npx`)
- [Lean 4](https://leanprover.github.io/lean4/doc/quickstart.html) (CLI must be available as `lean` in your PATH)
- (Optional) [ts-node](https://typestrong.org/ts-node/) for running TypeScript scripts directly

## How to Contribute

- Add or edit grammar and parser code in `grammar/`
- Add or edit Lean code and TypeScript scripts in `lean/`
- Add new statement definitions to `grammar/stmts.txt`
- Add new reason definitions to `grammar/reasons.txt`
- Add new proof examples as `.txt` files in `grammar/` (e.g., `tutorialProof.txt`)
- Update or add TypeScript utilities as needed
- If you add new scripts, update this README with usage instructions

## Running the proofToLeanPremises Script

This script parses a proof file (in Lezer grammar format), generates Lean4 code for the premises and goal, writes it to a temporary file, and runs Lean to check the result.

### Usage

From the root of the `geometry-proof-core` module:

```
npx ts-node lean/proofToLeanPremises.ts grammar/tutorialProof.txt
```

- Replace `grammar/tutorialProof.txt` with the path to your proof file.
- The script will print the generated Lean code and the output from the Lean CLI (success/errors for the goal).

### Example Output

```
--- Lean code ---

import ./EuclideanGeometry.lean

open EuclideanGeometry

def A : Point := { label := "A" }
def B : Point := { label := "B" }
def C : Point := { label := "C" }
def D : Point := { label := "D" }
def t_ABC : Triangle := { a := A, b := B, c := C }
def t_ADC : Triangle := { a := A, b := D, c := C }

theorem goal : CongruentTriangles t_ABC t_ADC :=
  sorry

--- Lean output ---

/tmp/tmp_proof_...lean:8:0: warning: declaration uses 'sorry'
/tmp/tmp_proof_...lean:8:0: info: try to solve it
```

## Adding New Statements, Reasons, or Proofs

- **Statements:** Add to `grammar/stmts.txt`
- **Reasons:** Add to `grammar/reasons.txt`
- **Proofs:** Add as `.txt` files in `grammar/`

## Building or Testing

- To build TypeScript: `npx tsc`
- To run scripts: `npx ts-node <script>`
- (No automated tests yet; add your own in `lean/` or `grammar/` as needed)
