"""Uses solver agent to solve all wrong proofs in geo-proof-dataset
and saves the solution and the metadata of each trial counts"""

import os
import json
import pandas as pd
from solver_agent import run_solver_agent

WRONG_PROOFS_DIR = "geo-proof-dataset/wrong_proofs"
WRONG_PROOFS_NAMES = [dir.name for dir in os.scandir(WRONG_PROOFS_DIR) if dir.is_dir()]
PROMPT_PATH = "backend/prompt/solver_with_valid_reasons_and_explanation.txt"
iter_dict = {}
# run for all files in wrong_proofs folder
for wp in WRONG_PROOFS_NAMES:
    print(f"Running solver agent for {wp}...")
    wp_dir = os.path.join(WRONG_PROOFS_DIR, wp)
    wp_path = os.path.join(wp_dir, f"{wp}.txt")
    wp_checker_output_path = os.path.join(wp_dir, f"{wp}_checker_output.txt")
    wp_solution_path = os.path.join(wp_dir, f"{wp}_solution.txt")
    # if solution exists skip
    if os.path.isfile(wp_solution_path):
        continue

    # run solver agent and save loop count or "solver failed"
    try:
        fixed_proof, solver_metadata = run_solver_agent(
            wp_dir, PROMPT_PATH, max_iterations=10
        )
        metadata = json.loads(solver_metadata)
        iterations = metadata["total_iterations"]
        iter_dict[wp] = iterations
    except ValueError as error:
        print(f"Solver failed for {wp} with {error}. Skipping {wp}.")
        iter_dict[wp] = "solver failed"

pd.DataFrame(iter_dict).to_csv(
    os.path.join("WRONG_PROOFS_DIR", "solver_iteration_count.csv"), index=False
)
