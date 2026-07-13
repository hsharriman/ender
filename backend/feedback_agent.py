import os
import json
from pathlib import Path
from dotenv import load_dotenv
from litellm import completion
from solver_agent import run_solver_agent


def give_feedback(system_prompt, solution_proof, student_proof, checker_output) -> str:
    # Use LLM to provide feedback on the proof
    load_dotenv()

    response = completion(
        model="gpt-5.5",
        api_base=os.getenv("OPENAI_API_BASE"),
        api_key=os.getenv("OPENAI_API_KEY"),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "assistant", "content": solution_proof},
            {"role": "user", "content": student_proof},
            {"role": "assistant", "content": checker_output},
        ],
    )

    print("Successfully got LLM response")
    return response.choices[0].message.content


def run_feedback_agent(
    original_proof_dir: str, solver_prompt_path: str, feedback_prompt_path: str
):
    proof_name = Path(original_proof_dir).name
    proof_path = os.path.join(original_proof_dir, f"{proof_name}.txt")
    checker_path = os.path.join(original_proof_dir, "checker_output.txt")
    solution_path = os.path.join(original_proof_dir, f"{proof_name}_solution.txt")
    solver_metadata_path = os.path.join(original_proof_dir, "solver_metadata.json")
    solution_loaded = False

    if os.path.exists(solver_metadata_path):
        try:
            with open(solver_metadata_path, "r", encoding="utf-8") as f_meta:
                metadata = json.load(f_meta)
            if metadata.get("solution_reached"):
                print("Solution already exists, skipping solver agent")
                with open(solution_path, "r", encoding="utf-8") as f_sol:
                    solution_proof = f_sol.read()
                solution_loaded = True

        except (json.JSONDecodeError, FileNotFoundError, PermissionError) as e:
            print(f"Metadata or solution file error, falling back to solver: {e}")

    # Run the solver if the file didn't exist, flag was false, or file reading failed
    if not solution_loaded:
        try:
            solution_proof = run_solver_agent(original_proof_dir, solver_prompt_path)
        except ValueError as error:
            print(f"Solver failed: {error}")

    with open(feedback_prompt_path, encoding="utf-8") as f:
        feedback_prompt = f.read()
    with open(proof_path, encoding="utf-8") as f:
        student_proof = f.read()
    with open(checker_path, encoding="utf-8") as f:
        checker_output = f.read()

    def save_feedback(feedback: str):
        """save feedback to feedback metadata"""
        metadata = {
            "proof_name": proof_name,
            "feedback_prompt_path": feedback_prompt_path,
            "feedback": feedback,
        }

        metadata_path = os.path.join(original_proof_dir, "feedback_metadata.json")

        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=4)

        print(f"Feedback metadata successfully saved to {metadata_path}")

    feedback = give_feedback(
        feedback_prompt, solution_proof, student_proof, checker_output
    )
    print(feedback)
    save_feedback(feedback)


if __name__ == "__main__":
    ORIGINAL_PROOF_DIR = "geo-proof-dataset/wrong_proofs/holt_s2-6_cio2_1corrs_inc1"
    SOLVER_PROMPT_PATH = "backend/prompt/solver_with_valid_reasons_and_explanation.txt"
    FEEDBACK_PROMPT_PATH = "backend/prompt/feedback_for_visual.txt"

    run_feedback_agent(ORIGINAL_PROOF_DIR, SOLVER_PROMPT_PATH, FEEDBACK_PROMPT_PATH)
