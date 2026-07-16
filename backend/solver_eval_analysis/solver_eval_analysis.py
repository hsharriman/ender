import os
import json
import pandas as pd
from backend.solver_agent import parse_checker_output


def analyze_solver_data(csv_file_path: str):
    df = pd.read_csv(csv_file_path)

    df["iterations"] = pd.to_numeric(df["iterations"], errors="coerce")
    df["cost"] = pd.to_numeric(df["cost"], errors="coerce")
    df["mutation_score"] = pd.to_numeric(df["mutation_score"], errors="coerce")

    total_avg_iterations = df["iterations"].mean()

    avg_iter_by_mutation = (
        df.groupby("mutation_score")["iterations"]
        .mean()
        .reset_index()
        .rename(columns={"iterations": "avg_iterations"})
    )

    total_cost = df["cost"].sum()

    print("=" * 50)
    print("          SOLVER RUN DATA ANALYSIS")
    print("=" * 50)
    print(f"• Total Average Iterations: {total_avg_iterations:.2f}")
    print(f"• Total Cost:               ${total_cost:.4f}")
    print("-" * 50)
    print("• Average Iterations by Mutation Score:")

    print(
        avg_iter_by_mutation.to_string(
            index=False,
            formatters={
                "mutation_score": "{:.2f}".format,
                "avg_iterations": "{:.2f}".format,
            },
        )
    )
    print("=" * 50)


def extract_failed_solutions(
    input_csv_path: str, output_csv_path: str = "unreached_solutions.csv"
):

    df = pd.read_csv(input_csv_path)
    is_unreached = df["solution_reached"].astype(str).str.strip().str.lower() == "false"
    unreached_df = df[is_unreached]
    unreached_df.to_csv(output_csv_path, index=False)


def extract_initial_checker_outputs(unreached_csv_path: str):
    df = pd.read_csv(unreached_csv_path)

    for _, row in df.iterrows():
        proof_name = str(row["proof_name"]).strip()
        metadata_path = os.path.join(
            "geo-proof-dataset", "wrong_proofs", proof_name, "solver_metadata.json"
        )

        initial_checker_output = "Metadata file not found"

        with open(metadata_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)

        iterations = metadata.get("iterations", [])
        if isinstance(iterations, list) and len(iterations) > 0:
            initial_checker_output = iterations[0].get(
                "checker_output", "checker_output key missing"
            )
        else:
            initial_checker_output = "No iterations recorded"

        parsed_output = parse_checker_output(initial_checker_output)
        problems = parsed_output.get("issues") or parsed_output.get("errors") or []
        print(problems[0]["type"], problems[0]["code"])


SOLVER_EVALUATION_FILE = "backend/solver_eval_analysis/solver_evaluation.csv"
SOLUTION_NOT_REACHED = "backend/solver_eval_analysis/unreached_solutions.csv"
# analyze_solver_data(SOLVER_EVALUATION_FILE)
# extract_failed_solutions(
#     input_csv_path=SOLVER_EVALUATION_FILE, output_csv_path=SOLUTION_NOT_REACHED
# )
# extract_and_parse_checker_outputs(SOLUTION_NOT_REACHED)
extract_initial_checker_outputs(unreached_csv_path=SOLUTION_NOT_REACHED)
