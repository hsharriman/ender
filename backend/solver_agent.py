import os
import subprocess
import json
from pathlib import Path
from dotenv import load_dotenv
from litellm import completion
from visualize_solver import visualize_changes


def run_solver(proof: str, checker_output: str, system_prompt: str) -> str:
    """Returns LLM solution of the proof"""
    # Use
    load_dotenv()

    response = completion(
        model="gpt-5.5",
        api_base=os.getenv("OPENAI_API_BASE"),
        api_key=os.getenv("OPENAI_API_KEY"),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": proof + checker_output},
        ],
    )

    print("Successfully got LLM response")
    return response.choices[0].message.content


def run_checker(proof_path: str) -> str:
    """Returns ENDER checker output run on student's proof"""
    command = ["npm", "run", "checkProof", "--", proof_path]
    # By setting stderr=subprocess.STDOUT, both streams are combined into output.stdout
    output = subprocess.run(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        check=False,
    )
    # Check the return code to determine if it actually succeeded or failed
    if output.returncode == 0:
        print("Successfully got checker output")
    else:
        print("Proof checker encountered an issue or validation failed")
    return output.stdout


def save_checker_output(proof_dir: str) -> str:
    """Save and return the checker output, it doesn't already exist."""
    proof_name = Path(proof_dir).name
    proof_path = os.path.join(proof_dir, f"{proof_name}.txt")
    checker_output_path = os.path.join(proof_dir, f"{proof_name}_checker_output.txt")
    if not os.path.exists(checker_output_path):
        checker_output = run_checker(proof_path)
        if checker_output:
            with open(checker_output_path, "w", encoding="utf-8") as f:
                f.write(checker_output)
            return checker_output
    else:
        print("Proof result already exists, skipping proof checker.")
        with open(checker_output_path, encoding="utf-8") as f:
            checker_output = f.read()
        return checker_output


def get_fixed_steps(solver_output: str) -> str:
    """Convert solver output to fixed steps text"""
    json_output = json.loads(solver_output)
    fixed_steps = json_output[0]["solution"]
    return fixed_steps


def get_fixed_proof(proof: str, fixed_steps: str, solution_path: str) -> str:
    """Save and return fixed proof that combine original proof's correct steps and fixed steps"""
    incorrect_step_number = fixed_steps[:4]
    original_proof = proof.split(incorrect_step_number)[0].strip()
    fixed_proof = original_proof + "\n" + fixed_steps
    # save solution
    with open(solution_path, "w", encoding="utf-8") as f:
        f.write(fixed_proof)
    return fixed_proof


def run_solver_agent(original_proof_dir: str, prompt_path, max_iterations=5):
    """Run solution loop"""
    # Get system prompt
    with open(prompt_path, encoding="utf-8") as f:
        system_prompt = f.read()

    # Append valid reasons and statements to the system prompt
    with open("src/checker/grammar/defs/reasons.defs.ts", "r", encoding="utf-8") as f:
        valid_reasons = f.read()
    with open("src/checker/grammar/defs/stmts.defs.ts", "r", encoding="utf-8") as f:
        valid_statements = f.read()
    system_prompt = f"{system_prompt}\nValid reasons: {valid_reasons}\n\
        Valid statements: {valid_statements}"

    # Get checker output
    proof_name = Path(original_proof_dir).name
    proof_path = os.path.join(original_proof_dir, f"{proof_name}.txt")
    solution_path = os.path.join(original_proof_dir, f"{proof_name}_solution.txt")

    checker_output = save_checker_output(original_proof_dir)
    with open(proof_path, encoding="utf-8") as f:
        student_proof = f.read()

    solver_metadata = {
        "proof_name": proof_name,
        "solver_prompt_path": prompt_path,
        "max_iterations": max_iterations,
        "iterations": [
            {
                "iteration": 0,
                "changed_steps": "",
                "solution": student_proof,
                "checker_output": checker_output,
                "is_correct": False,
            }
        ],
        "solution_reached": False,
        "total_iterations": 0,
    }
    # Run solution loop
    while (
        not solver_metadata["solution_reached"]
        and solver_metadata["total_iterations"] < max_iterations
    ):
        solver_metadata["total_iterations"] += 1
        solver_data = {
            "iteration": solver_metadata["total_iterations"],
            "changed_steps": "",
            "solution": "",
            "checker_output": "",
            "is_correct": False,
        }
        # Get LLM solution
        llm_solution = run_solver(student_proof, checker_output, system_prompt)

        fixed_steps = get_fixed_steps(llm_solution)
        fixed_proof = get_fixed_proof(
            solver_metadata["iterations"][-1]["solution"], fixed_steps, solution_path
        )
        solver_data["changed_steps"] = llm_solution
        solver_data["solution"] = fixed_proof

        # Validate solution
        checker_output = run_checker(solution_path)
        solver_data["checker_output"] = checker_output

        if "proof is correct" in checker_output:
            solver_data["is_correct"] = True
            solver_metadata["iterations"].append(solver_data)
            visualize_changes(json.dumps(solver_metadata))
            solver_metadata["solution_reached"] = True
            print(
                f"Correct solution found in {solver_metadata['total_iterations']} trial(s). Solution loop completed"
            )
            print(f"Solution saved to {solution_path}")
            return fixed_proof, solver_metadata
        else:
            # run llm again
            solver_metadata["iterations"].append(solver_data)
            visualize_changes(json.dumps(solver_metadata))
            print("Solution is incorrect, running the loop again.")
            student_proof = fixed_proof
    error = ValueError("The correct solution was never reached.")
    error.metadata = solver_metadata
    raise error


if __name__ == "__main__":
    PROOF_DIR = "geo-proof-dataset/wrong_proofs/holt_s4-4_exer13_1corrs_inc5"
    PROMPT_PATH = "backend/prompt/solver_with_valid_reasons_and_explanation.txt"
    try:
        solution, metadata = run_solver_agent(PROOF_DIR, PROMPT_PATH)
    except ValueError as error:
        print(f"Solver failed: {error}")
        metadata = getattr(error, "metadata", None)

    if metadata is not None:
        os.makedirs(PROOF_DIR, exist_ok=True)
        metadata_path = os.path.join(PROOF_DIR, "solver_metadata.json")

        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=4)

        print(f"Metadata successfully saved to {metadata_path}")
