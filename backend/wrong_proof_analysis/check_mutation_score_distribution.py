import os
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
import matplotlib.pyplot as plt
from tqdm import tqdm

WRONG_PROOFS_DIR = "geo-proof-dataset/wrong_proofs"
WRONG_PROOFS_DIRS = [d.path for d in os.scandir(WRONG_PROOFS_DIR) if d.is_dir()]


def read_single_metadata(proof_dir_path):
    """Worker function to read a single JSON file."""
    metadata_path = os.path.join(proof_dir_path, "metadata.json")
    try:
        with open(metadata_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if "mutation_score" in data:
                return float(data["mutation_score"]), None
            return None, "missing_key"
    except FileNotFoundError:
        return None, "missing_file"
    except (json.JSONDecodeError, ValueError):
        return None, "corrupted"


def check_mutation_score_distribution_fast():
    """Check mutation score distribution of wrong proofs in parallel"""
    scores = []
    missing_files = 0
    missing_keys = 0
    corrupted_files = 0

    print(f"Starting parallel scan of {len(WRONG_PROOFS_DIRS)} directories...")

    # read files in parallel.
    with ThreadPoolExecutor(max_workers=32) as executor:
        # Submit all tasks to the thread pool
        futures = {
            executor.submit(read_single_metadata, d): d for d in WRONG_PROOFS_DIRS
        }

        for future in tqdm(
            as_completed(futures), total=len(futures), desc="Reading files", unit="file"
        ):
            score, status = future.result()
            if score is not None:
                scores.append(score)
            elif status == "missing_file":
                missing_files += 1
            elif status == "missing_key":
                missing_keys += 1
            elif status == "corrupted":
                corrupted_files += 1

    # --- Print Data Summary ---
    total_processed = len(scores)
    print("\n" + "=" * 43)
    print("=== MUTATION SCORE DISTRIBUTION SUMMARY ===")
    print(f"Total directories scanned: {len(WRONG_PROOFS_DIRS)}")
    print(f"Scores successfully read : {total_processed}")
    print(f"Missing metadata.json    : {missing_files}")
    print(f"Missing 'mutation_score' : {missing_keys}")
    if corrupted_files > 0:
        print(f"Corrupted JSON files     : {corrupted_files}")
    print("-" * 43)

    if not scores:
        print("No mutation scores found to analyze.")
        return

    # Basic Statistics
    avg_score = sum(scores) / total_processed
    min_score = min(scores)
    max_score = max(scores)
    print(f"Minimum Score: {min_score}")
    print(f"Maximum Score: {max_score}")
    print(f"Average Score: {avg_score:.4f}")
    print("-" * 43)

    # Plot the Distribution
    plt.figure(figsize=(8, 5))
    plt.hist(scores, bins=20, edgecolor="black", alpha=0.7)
    plt.title("Mutation Score Distribution")
    plt.xlabel("Mutation Score")
    plt.ylabel("Frequency (Number of Proofs)")
    plt.grid(axis="y", linestyle="--", alpha=0.7)
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    check_mutation_score_distribution_fast()
