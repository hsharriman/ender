# Backend agents

The backend contains the LLM-assisted proof-repair and feedback workflow for
ENDER. It has two stages:

1. The **solver agent** repairs a student's proof and verifies every candidate
   with the ENDER checker.
2. The **feedback agent** uses the validated repair and the original checker
   diagnosis to generate Socratic feedback about the student's first error.

For the complete data flow and agent contracts, see [PIPELINE.md](PIPELINE.md).

## Before you run

Run these commands from the repository root. You need:

- Python 3.10 or later and Node.js/npm;
- the repository's Node dependencies, because the solver invokes
  `npm run checkProof` to validate each candidate;
- Python dependencies; and
- credentials for the LLM endpoint.

```bash
npm install
python -m pip install -r backend/requirements.txt
```

Create a root `.env` file with the credentials used by LiteLLM:

```dotenv
OPENAI_API_KEY=your-api-key
# Required only when using an OpenAI-compatible endpoint:
OPENAI_API_BASE=https://your-compatible-endpoint/v1
```

The agents load `.env` automatically. They call the model configured in
`solver_agent.py` and `feedback_agent.py`; running them therefore makes LLM
requests and may incur API costs.

## Proof-directory contract

The command-line agents expect a directory whose name matches its proof file.
For example:

```text
geo-proof-dataset/wrong_proofs/s1inc1/
└── s1inc1.txt
```

The proof must be valid ENDER input, even when its mathematical reasoning is
incorrect. The solver creates the remaining artifacts in this same directory:

```text
<proof-dir>/
├── <proof-name>.txt                              # student submission
├── <proof-name>_checker_output.txt               # cached initial diagnosis
├── <proof-name>_solution.txt                     # candidate / validated repair
├── solver_metadata.json                           # all solver attempts
└── feedback_metadata_no_dependency_diff.json     # generated feedback
```

> The checker-output cache is reused if it exists. Delete or refresh it before
> rerunning an edited student proof, otherwise the solver will use stale
> diagnostic information.

## Run the pipeline

Running the feedback automatically runs the solver. However, the solver could also be ran separately.

Run solver + feedback agents
```bash
python backend/feedback_agent.py path-to-wrong-proof-directory
```
Run solver only
```bash
python backend/solver_agent.py path-to-wrong-proof-directory
```

The solver uses `backend/prompt/solver_final.txt` and tries at most three
iterations by default. Each repaired proof is checked before it is accepted.
The feedback agent uses `backend/prompt/feedbacks_3_2.txt` by default and
reuses a validated solver result when one exists.

### Solver outcomes

The solver records one of the following statuses in `solver_metadata.json`:

| Status | Meaning |
| --- | --- |
| `correct` | The student proof is already correct. |
| `fixed` | The model returned a proposed repair; it is accepted only if the checker passes it. |
| `unfixable` | The proof cannot be completed from the available premises. |
| `unparsable` | The model response was not valid structured output; the loop retries while attempts remain. |

If no candidate passes before the iteration limit, the solver exits with an
error and still saves its metadata for investigation.

### Feedback output

The feedback result is saved in
`feedback_metadata.json`:

```json
{
  "proof_name": "s1inc1",
  "feedback_prompt_path": "backend/prompt/feedbacks_3_2.txt",
  "feedback": ["...", "...", "..."],
  "hint": null
}
```

For logical errors, the default prompt requests three different perspectives:
an error explanation, an alternative perspective, and a Socratic question. It
requests only one syntax-oriented response for parser errors, and no feedback
for a correct proof.

## Evaluate and inspect solver runs

### Batch solver evaluation

`backend/solver_eval.py` evaluates proofs under
`geo-proof-dataset/wrong_proofs_multiple_mutations_per_step` by default and
appends per-proof results to
`backend/solver_evaluation_multiple_mutations_per_step.csv`.

Before a batch run, review and, if needed, change:

- `wrong_proofs_dir` and `csv_output_path` in `run_solver_evaluation`;
- `PROMPT_PATH` to compare a different solver prompt; and
- the optional sampling code in `select_wrong_proofs` if a stratified sample is
  desired instead of evaluating every discovered proof directory.

Then run:

```bash
python backend/solver_eval.py
```

### Visualize a solver attempt

Use the visualizer to inspect the original proof or an individual solver
iteration:

```bash
python backend/visualize_solver.py path/to/<proof-dir> <iteration-index>
```

- `0` displays the student's initial proof.
- `1` displays the first solver attempt.
- `2` displays the second solver attempt, and so on.

## Feedback leakage evaluation

`backend/feedback_eval.py` contains two experiments for judging whether
feedback reveals too much of a solution:

1. **LLM-as-a-judge** compares the feedback with a natural-language solution.
2. **Embedding cosine similarity** compares sentence embeddings.

The LLM-as-a-judge approach is the preferred experiment so far. Embedding
similarity does not reliably treat mathematical abbreviations and their full
names as equivalent (for example, `SAS` and “Side-Angle-Side”).

The embedding experiment additionally requires `sentence-transformers`, which
is not currently listed in `backend/requirements.txt`:

```bash
python -m pip install sentence-transformers
python backend/feedback_eval.py
```

## Work completed and work remaining

### Completed / currently implemented

- Solver prompts are augmented with the current ENDER reason and statement
  definitions.
- Every proposed repair is validated by the checker before it becomes the
  reference solution.
- Solver attempts, checker output, status, and cost are persisted for later
  inspection.
- Feedback context removes checker dependency fields and reason parameters to
  reduce implementation-level leakage.
- The default feedback prompt focuses on the first error and requests distinct,
  concise, non-prescriptive messages.
- Initial leakage experiments were implemented with an LLM judge and embedding
  similarity.

### Remaining work

- Turn the leakage experiments into a repeatable evaluation suite with a
  dataset, thresholds, and recorded results.
- Add automated tests for agent-response parsing, preprocessing, and feedback
  output shape.
- Improve operational handling for failed LLM calls, malformed model output,
  and stale checker-output caches.
- Review feedback quality on a representative proof set, especially whether
  all three messages are genuinely distinct and do not leak the repair.
- Keep the prompts and this documentation synchronized with any changes to the
  proof grammar, checker output schema, or agent input contract.
