# Proof Checker

A TypeScript implementation of a proof checker for geometric proofs, following the outline in `gemini.md`.

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

## Usage

### Command Line

```bash
# Check a single proof file
npm run check-proof proofs/yourProof.txt

# Or use ts-node directly
npx ts-node proofChecker.ts proofs/yourProof.txt
```

### Programmatic Usage

```typescript
import { checkProof } from "./proofChecker";

// Check a proof file
checkProof("path/to/proof.txt");
```

## Proof File Format

Proofs should follow this format:

```
title: "Proof Title"
premises:
pt: A, B, C, D
tri: t_ABC t_ADC
c(AB,AD) [01]
c(a_BAC,a_DAC) [02]
-> c(t_ABC,t_ADC)

steps:
reflex_s() -> c(AC, AC) [03]
sas([01], [02], [03]) -> c(t_ABC,t_ADC) [04]
```

### Components

- **Title**: The proof title (optional)
- **Premises**:
  - `pt`: Points used in the proof
  - `tri`: Triangles defined in the proof
  - Given statements with step numbers: `c(AB,AD) [01]`
  - Goal statement: `-> c(t_ABC,t_ADC)`
- **Steps**: Proof steps in the format `reason(deps) -> stmt(args) [step_num]`

## Supported Reasons

The proof checker supports the following reason functions:

- `given()` - Given statements (assumed to be true)
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

The proof checker supports the following statement functions:

- `c(arg1, arg2)` - Congruent (can be segments, angles, or triangles)
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
🔍 Checking proof: testProof.txt

📋 Proof Analysis Results:
==================================================

📝 Title: Test Proof - Prove Triangles Congruent

📊 Statistics:
   • Total Steps: 5
   • Given Statements: 2
   • Proof Steps: 2

❌ Incorrect Steps: 0

🚫 Unused Steps: 0

🔄 Cycles: 0

🎯 Overall Assessment:
✅ Proof is CORRECT!
```

## Implementation Details

The proof checker is implemented using:

- **Arrow Functions**: All functions use arrow function syntax
- **Modular Design**: Separate functions for each checking aspect
- **TypeScript**: Full type safety with interfaces for all data structures
- **Graph Analysis**: Uses depth-first search for cycle detection and reachability analysis
- **Pretty Printing**: Clear, formatted output with emojis and structured information

## Limitations

The current implementation focuses on **syntax validation** rather than **logical correctness**. It checks:

- ✅ Correct number of dependencies for each reason
- ✅ Correct number of arguments for each statement
- ✅ Proper step numbering and references
- ✅ Graph structure and reachability

It does **not** check:

- ❌ Whether the geometric reasoning is logically sound
- ❌ Whether the specific geometric objects satisfy the conditions
- ❌ Whether the proof strategy is optimal or complete

This makes it suitable for catching common syntax errors and structural issues in proofs, but not for validating the mathematical correctness of the geometric reasoning.

## Log Level

1. Accepts log level options: --log-level or -l followed by debug, info, warn, or error
2. Defaults to warning level: Only shows warnings and errors by default

The log level system works as follows:

- `error`: Only shows error messages and proof analysis results
- `warn`: Shows warnings, errors, and proof analysis results (default)
- `info`: Shows info, warnings, errors, and proof analysis results
- `debug`: Shows all debug information, info, warnings, errors, and proof analysis results
