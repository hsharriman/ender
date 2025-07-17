---
You are an expert software developer working on a tool for Euclidean geometry. **Your primary goal is to implement and extend a grammar that parses descriptions of geometric proofs.** The grammar should process the givens and goals of a problem and generate the logical steps for a formal proof. You will write clean, efficient, and test-driven code that integrates with the existing architecture.
---

### ## Core Technologies

This project uses a specific stack for different components. Adhere to these conventions:

- **Language**: **TypeScript** is used for all frontend and parsing logic. Enable `strict` mode and ensure all code is strongly typed.
- **Visualization**: The user interface and visualizations are built with **React**. Use functional components with Hooks (`useState`, `useEffect`, `useContext`).
- **Lexical Analysis**: **moo.js** is used for tokenizing the input language. When modifying the language, first check if the tokenizer needs updates.
- **Parsing**: **Lezer** is used to create the parser from a formal grammar file (`.grammar`). This parser will form the core of the proof generation system.
- **Proof Evaluation**: The **LEAN** theorem prover is the backend used to **evaluate the correctness of the generated proof steps**. All output proof structures must be compatible with LEAN 4 syntax.

---

### ## Development Guidelines

- **Test-Driven Development (TDD)**: This project follows a strict TDD methodology. **For any new feature, bug fix, or logic change, you must write the test cases first.** The tests should cover success, edge, and failure cases. Only after writing comprehensive tests should you implement the feature to make them pass.
- **Code Style**: Follow the existing code style and the rules defined in the project's `.eslintrc.json` file. All new code must be formatted before committing. Prefer to organize source code into classes, with one exported class per file.
- **Documentation**: Add TSDoc comments to all new functions, types, and React components, explaining their purpose, parameters, and return values.
- **Commit Messages**: Follow the Conventional Commits specification for all git commits (e.g., `feat:`, `fix:`, `test:`, `docs:`).

### Development Plan

- Create a detailed, step-by-step development plan for how you will build out this theorem prover based on these high-level steps:

1. Create a folder called `grammar` that will include all code related to this feature.
2. Create a grammar that is suitable to declare statements, and one that is suitable to declare reasons, using Lezer.
3. Create 1 file that holds all statement definitions, 1 file that holds all reason definitions.
4. Adapt the following example as your first end-to-end test case:

```
title: Prove Triangles Congruent (correct)
premises:
pt: A, B, C, D
tri: t_ABC t_ADC
c(AB,AD) [01] // c = congruent
c(a_BAC,a_DAC) [02] // a prefix = object is angle
-> c(t_ABC,t_ADC)

Proof Steps:
reflex() -> c(AC, AC) [03]
sas([01], [02], [03]) -> c(t_ABC,t_ADC) [04]

```

5. Implement the grammar, described below. Ensure that all of the test cases pass.

Clearly describe any uncertainties that you have. Include the following context about the desired grammar format in your planning:

```
title: <any string>
premises:
pt: <required, comma separated list of points in the proof. must be first line in premises>
seg: <optional, comma separated list of segments in the proof>
ang: <optional, comma separated list of angles in the proof>
tri: <optional, comma separated list of triangles in the proof>
<series of numbered statements, separated by \n>
<goal statement of the proof>
steps:
<series of numbered steps, separated by \n>
```

Inline comments are allowed, and are indicated with `//`. Multiline comments can be indicated with `/* <comment> */`.
geometric objects can be of type Point, Segment, Angle, Triangle. Angles are made up of 3 points, triangles are made up of 3 segments, 3 angles, and 3 points.
Points can be any 1 capitalized letter of the alphabet (i.e. "A" or "X"). repeats are disallowed within a proof.
Segments can be any 2 capitalized letters of the alphabet, but must be made up of 2 defined points (i.e. "AX"). repeats are disallowed within a proof. Once defined, segments can be referred to by any permutation of the same 2 points, so both "AX" and "XA" should define the same segment.
Angles always start with the prefix “a\_” and should be followed by 3 capitalized letters. The letters must map to points defined in the proof. Angles are defined by 2 endpoints and a corner. The corner point must be the 2nd letter, so “a_ABC” has a corner point of B. The order of endpoints does not matter, both “a_ABC” and “a_CBA” refer to the same angle.

Triangles always start with the prefix “t\_” and should be followed by 3 capitalized letters. The letters must map to points defined in the proof. Triangles are defined by 3 points. When a triangle is defined, it should also result in the creation of 3 segments and 3 angles if they were not already declared. For the triangle “t_ABC”, the segments should be “AB”, “BC”, “CA”, and the angles should be “a_BAC”, “a_ABC”, “a_ACB”. Once defined, triangles can be referred to by any permutation of the three points, so “t_ABC” is the same as “t_BAC” or “t_CBA”, and so on.

Statements take the form “<name>(<comma separated list of geometric args>) [<step number>]”. There can be any number of given statements. The first given statement should have a step number of 01. The statement must be drawn from a pre-defined set of valid statements.

The goal of the proof is indicated with 1 line that begins with “->”. The goal of the proof must be a statement with no step number, which is one statement from a pre-defined set of valid statements.

Within steps:
Proof steps take the form: <reason>(<comma separated list of dependencies>) -> <statement>(comma separated list of arguments>) <step number>

Here are some examples of valid statements:
altintconv([07]) -> para(WX,YZ) [08]
conadjangle([01]) -> c(a_PSL,a_PSU) [04]
reflex() -> c(PS) [05]
asa([03], [04], [05]) -> c(t_LSP,t_USP) [06]
cpctc([06]) -> c(a_SLP,a_SUP) [07]
asa([02], [07], [08]) -> c(t_LNU,t_UQL) [09]

Every reason must come from a valid, pre-defined list of reasons. Reasons have a required number of arguments which must be satisfied by previous steps in the proof. These must be passed into the reason. So “asa([03], [04], [05])” requires 3 statements, which are being satisfied by statements 3, 4, and 5.

On the RHS of the -> is the statement that is concluded based on the reason. This must be a valid conclusion drawn from the definition of the reason that advances the known state of the proof meaningfully towards the goal. The arguments within the statement are the geometric objects to which the statement applies. For instance “c(a_PSL,a_PSU)” means that angles PSL and PSU are established to be congruent.
Each statement has 1 number assigned to it, indicated by brackets at the end of the line, i.e. “[08]”, “[87]”, “[105]”. Future steps in the proof use these step numbers to indicate dependencies to a reason.
