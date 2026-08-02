# Feedback Agent Pipeline

This document describes the offline feedback pipeline in `backend/`. Its goal
is to turn a student's ENDER proof attempt into targeted, Socratic feedback
without exposing a complete solution.

The pipeline has two agents:

1. The **solver agent** produces and validates a corrected proof.
2. The **feedback agent** uses the validated correction and checker diagnosis to
   explain only the student's first error.

## Overview

```text
student proof directory
        |
        v
ENDER checker --------------------> initial checker output
        |                                   |
        v                                   v
solver agent <-------------------- proof + checker diagnosis
        |
        |  corrected continuation
        v
ENDER checker (validation loop)
        |
        +-- correct --> validated solution --------+
        |                                          |
        +-- incorrect --> solver retry             v
                                           feedback preprocessing
                                                    |
                                                    v
                                             feedback agent
                                                    |
                                                    v
                                           feedback metadata JSON
```

The checker is the source of truth for correctness. An LLM-generated solution
is not used as feedback context until it has passed the checker.

## Input layout

Both agents operate on a directory whose name matches the proof name:

```text
<proof-dir>/
├── <proof-name>.txt                    # student's original proof
├── <proof-name>_checker_output.txt     # cached checker result
├── <proof-name>_solution.txt           # validated solver result, when found
├── solver_metadata.json                 # solver attempts and outcomes
└── feedback_metadata.json
```

`<proof-name>_checker_output.txt` is created by `save_checker_output` when it
does not already exist. It contains the ENDER checker's JSON result, including
`isCorrect`, issues, error codes, and issue details.

## 1. Solver agent

Implementation: `backend/solver_agent.py`  
Prompt: `backend/prompt/solver_final.txt`

The solver receives the current proof, its checker output, and the current
reason and statement definitions from:

- `src/checker/grammar/defs/reasons.defs.ts`
- `src/checker/grammar/defs/stmts.defs.ts`

The prompt requires the model to return one JSON object in an array with:

```json
{
  "status": "correct" | "fixed" | "unfixable",
  "solution": "corrected proof from the first incorrect step" | null
}
```

### Validation loop

`run_solver_agent(proof_dir, prompt_path, max_iterations=3)` performs these
steps:

1. Run (or load) the checker on the student's proof.
2. Ask the solver for a status and a corrected proof continuation.
3. Parse the model response. Invalid JSON is recorded as `unparsable`.
4. If the status is `fixed`, combine the unchanged proof prefix with the
   proposed continuation and save it as `<proof-name>_solution.txt`.
5. Run the checker on that candidate solution.
6. If the checker reports `isCorrect: true`, mark the solution as reached.
   Otherwise, use the candidate and its new checker output as the next
   iteration's input.
7. Stop after a validated solution, an `unfixable` response, or the iteration
   limit.

The solver fixes the earliest root error first. Later errors can be downstream
effects and may disappear after that correction.

### Solver statuses and termination

| Status / condition | Pipeline behavior |
| --- | --- |
| `correct` | The prompt identifies the submitted proof as correct; no corrected continuation is needed. |
| `fixed` + checker passes | The candidate becomes the validated reference solution. |
| `fixed` + checker fails | The candidate and new checker result feed the next solver attempt. |
| `unfixable` | Stop early; the agent could not complete the proof from the supplied premises. |
| `unparsable`, missing solution, or `null` solution | Record the attempt and retry while iterations remain. |
| Iteration limit reached | Raise an error because no validated solution was found. |

### Solver artifacts

`solver_metadata.json` records the original checker result and each attempt:

- LLM output and parsed `llm_status`
- candidate solution
- checker output for that candidate
- whether the candidate passed validation
- total iterations, total cost, and final status

This metadata lets the feedback stage reuse a previously validated solution
instead of calling the solver again.

## 2. Feedback preparation

Implementation: `backend/feedback_preprocessors.py`

Once a validated solution is available, the feedback stage prepares a smaller,
student-safe context for the feedback model:

| Input | Preparation | Why |
| --- | --- | --- |
| Student proof and validated solution | Remove reason parameters, such as references inside `reason(...)`. | Avoid exposing implementation-level dependencies. |
| Original checker output | Remove `ref`, `argIndex`, `index`, and `dependsOn` from issue details. | Keep checker internals out of student feedback. |
| Original checker output | Look up only its error-code explanations in `src/checker/ERROR_CODES.md`. | Give the model a human-readable diagnosis. |
| Student proof vs. validated solution | Compute word-level insert, replace, and delete changes. | Identify what differs without asking the model to infer the entire correction. |

The feedback prompt explicitly instructs the model not to reveal the correct
next step, theorem, construction, or future proof steps.

## 3. Feedback agent

Implementation: `backend/feedback_agent.py`  
Default prompt: `backend/prompt/feedbacks_3_2.txt`

The feedback agent is given the prepared student proof, validated solution,
sanitized checker output, relevant error-code explanation, and the changes
needed to repair the proof. It produces feedback about the *first* incorrect
step only.

Expected response behavior:

| Student-proof state | Expected feedback payload |
| --- | --- |
| Correct | `{"feedback": []}` |
| Unfixable / underspecified | `{"feedback": "unfixable"}` |
| Parser error | One syntax-only feedback message |
| Other first error | Three short, conceptually distinct messages: explanation, alternative perspective, and Socratic question |

The feedback prompt also requires any mentioned step, object, statement, or
reason to be wrapped in double curly braces, and limits each message to fewer
than 30 words.

The final result is written to
`feedback_metadata_no_dependency_diff.json` with the proof name, prompt path,
feedback, and optional hint.
