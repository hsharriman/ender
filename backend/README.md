# Feedback agent

feedback agent takes in

- `feedbacks_3_2.txt` prompt
- `llm_status` which indicates if the student's solution is either "correct" |
  "fixed" | "unfixable" | "unparsable"
- student's solution without reason params
- what part of the student should be fixed (given by
  `feedback_preprocessors/find_solution_changes`)

  format:

  ```text
  replace: '{old_part}'
  should be changed into '{new_part}'

  delete: '{old_part}' should be deleted"

  add: '{new_part}' should be added"
  ```

- checker result without dependency statements(index, ref, argIndex, dependsOn)
- explanations on the checker error code (only on the error code that appeared
  in the checker)

## Run feedback agent

There should be a directory named the same as the name of the wrong proof to run
the feedback agent.

```
python backend/feedback_agent.py path-to-wrong-proof-directory
```

Output file:

- feedback_metadata.json
  - "proof_name"
  - "feedback_prompt_path"
  - "feedback": [feedback1, feedback2, feedback3]
  - "hint": null

if you want to generate feedback and hint instead of 3 direction feedbacks, use
`feedback_for_visual.txt` prompt in the archive folder

## Feedback evaluation (WIP)

Feedback leakage evaluation trials:

1. LLM-as-a-judge: `llm_based_feedback_leakage_eval`
2. cosine similarity score: `metric_based_feedback_leakage_eval`

--> cosine similarity score doesn't capture mathematical symbols in similar
embeddings (ex. SAS and Side-Angle-Side are calculated in a distant embeddings),
so **LLM-as-a-judge** should be used.

# Solver agent

status

```
"correct" | "fixed" | "unfixable" | "unparsable"
```

## Run solver agent for one file

```
python backend/solver_agent.py path-to-wrong-proof-directory
```

Output files:

- wrong-proof-name_checker_output.txt
- wrong-proof-name_solution.txt
- solver_metadata.json

## Run solver evaluation

- The evaluation is currently set to run for all proofs in the
  `wrong_proofs_multiple_mutations_per_step` directory. Select the intended
  wrong_proofs directory before running the file. If the proof has to be sampled
  uncomment the `select_wrong_proofs` section (line 154, 157-160)
- modify `select_wrong_proofs` function if the wrong proofs has to be selected
  in different criteria(i.e. `edit_distance`). Currently, it is set to use
  `mutation_distance` to select the sample.
- After modification, run:

```
python backend/solver_eval.py
```

### Visualize solver

Useful for checking solver failures.

To view

- initial student's solution set `target-step-to-compare` to 0
- initial solver agent's solution set `target-step-to-compare` to 1
- second trial of the solver agent's solution set `target-step-to-compare` to 2,
  etc.

```
python backend/visualize_solver.py path-to-solution-directory target-step-to-compare
```
