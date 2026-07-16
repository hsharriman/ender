"""Uses solver agent to solve all wrong proofs in geo-proof-dataset
and saves the solution and the metadata of each trial counts"""

import os
import json
import random
import csv
import time
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
from solver_agent import run_solver_agent

PROMPT_PATH = "backend/prompt/solver_final.txt"


def _get_mutation_score(proof_dir_path):
    """Worker function to quickly read the proof name and its mutation score."""
    proof_name = os.path.basename(proof_dir_path)
    metadata_path = os.path.join(proof_dir_path, "metadata.json")
    try:
        with open(metadata_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if "mutation_score" in data:
                # Convert to integer since scores are 1-6
                return proof_name, int(round(float(data["mutation_score"])))
    except Exception:
        pass
    return None


def select_wrong_proofs(wrong_proofs_dir, sample_size=20):
    """select wrong proofs for each mutation score by sample size"""
    proof_dirs = [d.path for d in os.scandir(wrong_proofs_dir) if d.is_dir()]
    proof_to_score = {}

    print(f"Scanning {len(proof_dirs)} directories to group by mutation score...")
    with ThreadPoolExecutor(max_workers=32) as executor:
        futures = [executor.submit(_get_mutation_score, d) for d in proof_dirs]
        for future in tqdm(
            as_completed(futures),
            total=len(futures),
            desc="Reading scores",
            unit="file",
        ):
            result = future.result()
            if result:
                proof_name, score = result
                proof_to_score[proof_name] = score

    # Group the proof names by score (1 through 6)
    score_groups = defaultdict(list)
    for proof_name, score in proof_to_score.items():
        if 1 <= score <= 6:
            score_groups[score].append(proof_name)

    # Randomly select proofs for each score group
    selected_proofs = {}
    print("\n=== RANDOM SELECTION RESULTS ===")

    for score in range(1, 7):
        available_proofs = score_groups[score]
        total_available = len(available_proofs)

        # Determine actual number to sample (handles cases where a score has < 20 proofs)
        k = min(sample_size, total_available)

        # Pick random distinct elements
        selected_proofs[score] = random.sample(available_proofs, k)

        print(f"Score {score}: Selected {k} / {total_available} available proofs.")
    return selected_proofs


def _get_data_from_metadata(wp_metadata_path, row_data):
    if os.path.isfile(wp_metadata_path):
        try:
            with open(wp_metadata_path, "r", encoding="utf-8") as mf:
                meta_data = json.load(mf)
                row_data["iterations"] = meta_data.get("total_iterations", "N/A")
                row_data["solution_reached"] = True
                row_data["cost"] = meta_data.get("total_cost", "N/A")
                row_data["status"] = (
                    "success_skipped"  # Flagged as skipped but successful
                )
        except Exception as e:
            row_data["status"] = "failed_skipped"
            row_data["error_message"] = f"Failed to read existing metadata: {e}"
    else:
        # Solution file exists, but metadata JSON is missing
        row_data["status"] = "failed_skipped"
        row_data["error_message"] = (
            "Solution exists but solver_metadata.json is missing"
        )

    return row_data


def _process_single_proof(wp, score, wrong_proof_dir, prompt_path, max_iterations=3):
    wp_solution_path = os.path.join(wrong_proof_dir, f"{wp}_solution.txt")
    wp_metadata_path = os.path.join(wrong_proof_dir, "solver_metadata.json")

    row_data = {
        "proof_name": wp,
        "mutation_score": score,
        "status": "pending",
        "iterations": "N/A",
        "solution_reached": False,
        "cost": "N/A",
        "error_message": "",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

    # Solution already exists
    # if os.path.isfile(wp_solution_path):
    #     return _get_data_from_metadata(wp_metadata_path, row_data)

    # if no solution exists, run solver
    try:
        # Run the LLM-driven agent
        _, solver_metadata = run_solver_agent(
            wrong_proof_dir, prompt_path, max_iterations=max_iterations
        )
        row_data["iterations"] = solver_metadata.get("total_iterations", "N/A")
        row_data["cost"] = solver_metadata.get("total_cost", "N/A")
        row_data["solution_reached"] = True
        row_data["status"] = "success"

    except ValueError as error:
        # Handle logical failures
        tqdm.write(f"Solver failed for {wp}: {error}")
        row_data["status"] = "failed"
        row_data["error_message"] = str(error)

    except Exception as e:
        # Catch-all for API issues, network dropouts, or keyboard interrupts
        tqdm.write(f"Unexpected error processing {wp}: {e}")
        row_data["status"] = "exception"
        row_data["error_message"] = str(e)
    return row_data


def run_solver_evaluation(
    wrong_proofs_dir="geo-proof-dataset/wrong_proofs",
    prompt_path=PROMPT_PATH,
    csv_output_path="backend/solver_evaluation.csv",
    seed=42,
):
    """Run solver evaluation pipeline for selected wrong proofs and save to csv"""
    os.makedirs(os.path.dirname(csv_output_path), exist_ok=True)

    random.seed(seed)
    selected_dataset = select_wrong_proofs(wrong_proofs_dir, sample_size=20)

    # Flatten selected_dataset to a list of (proof_name, mutation_score) tuples
    proof_list = []
    for score, proofs in selected_dataset.items():
        for wp in proofs:
            proof_list.append((wp, score))

    headers = [
        "proof_name",
        "mutation_score",
        "status",
        "solution_reached",
        "iterations",
        "cost",
        "error_message",
        "timestamp",
    ]

    # Check if we should append to an existing file or create a new one with headers
    file_exists = os.path.isfile(csv_output_path)
    with open(
        csv_output_path, mode="a", newline="", encoding="utf-8", buffering=1
    ) as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        if not file_exists:
            writer.writeheader()

        # Process every proof in the list with a beautiful progress bar
        for wp, score in tqdm(proof_list, desc="Running Solver Agent", unit="proof"):
            wp_dir = os.path.join(wrong_proofs_dir, wp)
            processed_data = _process_single_proof(wp, score, wp_dir, prompt_path)
            # Write row to CSV and force flush it to the hard drive immediately
            writer.writerow(processed_data)
            f.flush()
    print("Solver evaluation completed!")


if __name__ == "__main__":
    run_solver_evaluation()
