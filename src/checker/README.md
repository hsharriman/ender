# Ender Proof Checker

A TypeScript implementation of a proof checker for geometric proofs.

## Features

The proof checker evaluates the correctness of geometric proofs by:

1. **Parsing Proof Files**: Reads proof files in the specified format
2. **Loading Definitions**: Loads reason and statement definitions from `grammar/defs/`
3. **Syntax Validation**: Checks that each step follows the correct syntax
4. **Dependency Tracking**: Verifies that reason dependencies match expected types
5. **Graph Analysis**: Builds a dependency graph and analyzes:
   - Incorrect steps
   - Unused steps (steps that don't contribute to the goal)
   - Cycles in the proof
6. **Goal Verification**: Checks if the final statement matches the proof goal

## Setup Instructions

### Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Comes with Node.js

### Initial Setup

1. **Navigate to the ender-proof-core directory**:

   ```bash
   cd ender-proof-core
   ```

2. **Install Node.js dependencies**:

   ```bash
   npm install
   ```

3. **Run tests to ensure everything works**:
   ```bash
   npm test
   ```

### Apple Silicon (M1/M2/M3) Setup

If you're on an Apple Silicon Mac, follow these additional steps:

1. **Install Node.js for Apple Silicon**:

   - Download the ARM64 version from [nodejs.org](https://nodejs.org/)
   - Or use Homebrew: `brew install node`

2. **Verify architecture**:

   ```bash
   node --version
   npm --version
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

## Usage

### Command Line

```bash
# Check a single proof file
npm run check-proof proofs/yourProof.txt

# Debug mode with detailed output
npm run check-proof -- --log-level debug proofs/yourProof.txt

```

### Programmatic Usage

```typescript
import { checkProof } from "./proofChecker";

// Check a proof file
checkProof("path/to/proof.txt");
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- grammar/test/grammar.test.ts
```

## Project Structure

```
ender-proof-core/
├── grammar/                # Grammar and parsing logic
│   ├── defs/               # Reason and statement definitions
│   ├── reasons/            # Symbolic checks of reasons
│   └── test/               # Grammar tests
├── geometry/               # Geometric object implementations
├── proofs/                 # Example proof files
├── types/                  # TypeScript type definitions
└── proofChecker.ts         # Main proof checker
```

### Key Terms for Proof

- `premises`: information that is given to be true for the proof
- `goal`: final outcome of the proof. Given the `premises` listed, prove that the `goal` can be concluded.
- `steps`: the order and justification of arguments that demonstrate how a proof moves from premises/givens to goal. Made up of statements and reasons.
- `statements`: Information about geometric objects in the proof, such as that two segments are congruent, D is the midpoint of MN, triangle XYZ is equilateral, etc.
- `reasons`: Geometric justification for why a statement can be concluded (i.e., by a definition, a theorem, etc.), such as SAS, Alternate Interior Angles, or Vertical Angles.
- `dependencies`: Previously stated facts about a proof that make it possible for a reason to be used in a proof step, such as SAS requiring two congruent sides and the included congruent angle, or alternate interior angles requiring parallel lines crossed by a transversal.

## Proof File Format

Proofs should follow this format:

```
title: "Proof Title"
premises:
pt: A, B, C, D
tri: t_ABC t_ADC
con_seg(AB,AD) [01]
con_ang(a_BAC,a_DAC) [02]
-> con_tri(t_ABC,t_ADC)

steps:
reflex_s() -> con_seg(AC, AC) [03]
sas([01], [02], [03]) -> con_tri(t_ABC,t_ADC) [04]
```

### Proof File Components

- **Title**: The proof title (optional) (any string)
- **Premises**:
  - `pt`: Names of all points used in the proof, comma separated
  - `tri`: Names of all triangles used in the proof, comma separated.
  - Given statements with step numbers, counting up from 1: `con_seg(AB,AD) [01]`
  - Goal statement: denoted with a new line beginning with an arrow, such as `-> con_tri(t_ABC,t_ADC)`
- **Steps**: Proof steps in the format `reason(deps) -> stmt(args) [step_num]`. In plain English, this reads as: "If the geometric reason is correctly satisfied, then the statement is proven to be true."
  - `deps`: dependencies are passed into the reason by comma separated list of step numbers. So, in the example above, `sas([01], [02], [03])` corresponds to `sas(con_seg(AB, AD), con_ang(a_BAC, a_DAC), con_seg(AC, AC))`. The order and type of each statement passed into a reason must match the expected inputs defined in `grammar/defs/reasons.txt`.
  - `step_num`: each step of a proof must have a unique numerical identifier starting from n+1, where n = number of numbered given statements. In the example above, there are 2 given statements, so the first step has an identifier of `[03]`.

## Supported Objects

- **Points:** Any 1 uppercase capital letter [A-Z], no repeats allowed. All other objects must only use letters defined as points, so if the points declared are A, B, C, D, all non-point objects can only contain the letters ABCD.
- **Segments:** 2 uppercase capital letters (i.e. AB, CD). The order of the points does not matter, so segment AB can be referred to by either AB or BA.
- **Angles:** Prefix `a_` followed by 3 capital letters. The second letter must be the angle's corner point, so `a_ABC` and `a_CBA` refer to the same angle with B as the corner point, but `a_BAC` is an angle with A as the corner.
- **Triangles:** Prefix `t_` followed by 3 capital letters. Any permutation of the 3 letters will refer to the same triangle, so `t_ABC = t_BAC = t_CAB = t_CBA` and so on.

## Supported Reasons

For the full list of supported reasons including their abbreviations, check `grammar/defs/reasons.txt`. The proof checker supports the following reason functions:

- `reflex_s()` - Reflexive property for segments
- `reflex_a()` - Reflexive property for angles
- `sas(con_seg, con_ang, con_seg)` - Side-Angle-Side congruence
- `sss(con_seg, con_seg, con_seg)` - Side-Side-Side congruence
- `asa(con_ang, con_seg, con_ang)` - Angle-Side-Angle congruence
- `aas(con_ang, con_ang, con_seg)` - Angle-Angle-Side congruence
- `rhl(con_right, con_seg, con_seg)` - Right-Hypotenuse-Leg congruence
- `aaa(con_ang, con_ang, con_ang)` - Angle-Angle-Angle similarity
- `cpctc(con_tri)` - Corresponding Parts of Congruent Triangles
- `vert_ang(intersect_seg)` - Vertical angles
- `conv_alt_int(para, transversal)` - Converse of alternate interior angles

## Supported Statements

For the full list of supported statements including their abbreviations, check `grammar/defs/stmts.txt`. The proof checker supports the following statement functions:

- `con_seg(Segment s1, Segment s2)` - Congruent segments
- `con_ang(Angle a1, Angle a2)` - Congruent angles
- `con_tri(Triangle t1, Triangle t2)` - Congruent triangles
- `right(Angle a)` - Right angle
- `para(Segment s1, Segment s2)` - Parallel segments
- `perp(Segment s1, Segment s2)` - Perpendicular segments
- And more...

## Output

The proof checker provides detailed output including:

- **Statistics**: Total steps, given statements, proof steps
- **Incorrect Steps**: Steps that fail syntax or dependency checks
- **Unused Steps**: Steps that don't contribute to reaching the goal
- **Cycles**: Circular dependencies in the proof
- **Overall Assessment**: Whether the proof is correct or has issues

## Example Output

```
📋 Proof Analysis Results:
==================================================
📝 Title: S1INC1 - Prove Angles Congruent #1
🎯 Goal: con_ang(a_BAD, a_DCB)
✅ Goal Match: YES
📋 Goal Details: Goal matched: con_ang(a_BAD, a_DCB)

📊 Statistics:
   • Total Steps: 5
   • Given Statements: 3
   • Proof Steps: 2

❌ Incorrect Steps: 1
   • Step 04
🚫 Unused Steps: 0
🔄 Cycles: 0
🔄 Duplicate Steps: 0
📝 Step Number Errors: 0
🔷 Geometric Object Errors: 0

🎯 Overall Assessment:
❌ Proof has issues that need to be addressed.
```

<!-- ## Development

### TypeScript Configuration

The project uses TypeScript with ES modules:

- Target: ES6
- Module: ESNext
- Strict mode enabled
- Declaration files generated

### Testing

Tests are written using Jest with TypeScript support:

- Test files: `**/test/**/*.test.ts`
- ESM support enabled
- Coverage reporting available

### Building

```bash
# Compile TypeScript to js
npm run build
``` -->

## Log Level

1. Accepts log level options: --log-level or -l followed by debug, info, warn, or error
2. Defaults to warning level: Only shows warnings and errors by default

The log level system works as follows:

- `error`: Only shows error messages and proof analysis results
- `warn`: Shows warnings, errors, and proof analysis results (default)
- `info`: Shows info, warnings, errors, and proof analysis results
- `debug`: Shows all debug information, info, warnings, errors, and proof analysis results

## Troubleshooting

- Check the test files in `grammar/test/` for usage examples
- Review the proof files in `proofs/` for format examples
- Run `npm run debug-proof` for detailed debugging information
