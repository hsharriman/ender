import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv
from litellm import completion
from solver_agent import run_solver_agent

SOLVER_PROMPT_PATH = "backend/prompt/solver_with_valid_reasons_and_explanation.txt"
FEEDBACK_PROMPT_PATH = "backend/prompt/feedbacks_gpt.txt"


def give_feedback(
    system_prompt,
    solution_proof,
    student_proof,
    checker_output,
    error_code_explanation="",
) -> str:
    """Use LLM to provide feedback on the proof"""
    load_dotenv()

    response = completion(
        model="gpt-5.5",
        api_base=os.getenv("OPENAI_API_BASE"),
        api_key=os.getenv("OPENAI_API_KEY"),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "assistant", "content": solution_proof},
            {"role": "user", "content": student_proof},
            {"role": "assistant", "content": checker_output + error_code_explanation},
        ],
    )

    print("Successfully got LLM response")
    return response.choices[0].message.content


def postprocess_output(llm_output):
    """Split and return feedback and hint separately"""
    try:
        llm_output = json.loads(llm_output)
        feedback = llm_output.get("feedback")
        hint = llm_output.get("hint")
        return feedback, hint
    except json.JSONDecodeError as e:
        print(f"LLM output format is wrong please regenerate the feedback.\n{e}")


def run_feedback_agent(
    original_proof_dir: str,
    solver_prompt_path: str = SOLVER_PROMPT_PATH,
    feedback_prompt_path: str = FEEDBACK_PROMPT_PATH,
):
    """Run feedback agent on the original proof and return metadata"""
    proof_name = Path(original_proof_dir).name
    proof_path = os.path.join(original_proof_dir, f"{proof_name}.txt")
    checker_path = os.path.join(original_proof_dir, f"{proof_name}_checker_output.txt")
    solution_path = os.path.join(original_proof_dir, f"{proof_name}_solution.txt")
    solver_metadata_path = os.path.join(original_proof_dir, "solver_metadata.json")
    solution_proof = ""

    if os.path.exists(solver_metadata_path):
        try:
            with open(solver_metadata_path, "r", encoding="utf-8") as f_meta:
                metadata = json.load(f_meta)
            if metadata.get("iterations")[0].get("llm_status") == "unfixable":
                print("The proof cannot be solved")
                feedback = {"feedback": "unfixable"}
            elif metadata.get("iterations")[0].get("llm_status") == "correct":
                print("The student's solution is already correct")
                feedback = {"feedback": "Good job! Your solution is already correct!!"}
            else:
                if metadata.get("iterations")[0].get("llm_status") == "unparsable":
                    print("The proof has syntax errors")

                if metadata.get("solution_reached"):
                    print("Solution already exists, skipping solver agent")
                    with open(solution_path, "r", encoding="utf-8") as f_sol:
                        solution_proof = f_sol.read()
                else:
                    try:
                        solution_proof, _ = run_solver_agent(
                            original_proof_dir, solver_prompt_path
                        )
                    except ValueError as error:
                        print(f"Solver failed: {error}")

                with open(feedback_prompt_path, encoding="utf-8") as f:
                    feedback_prompt = f.read()
                with open(proof_path, encoding="utf-8") as f:
                    student_proof = f.read()
                with open(checker_path, encoding="utf-8") as f:
                    checker_output = f.read()
                with open("src/checker/ERROR_CODES.md", encoding="utf-8") as f:
                    error_code_explanation = f.read()

                if solution_proof != "":
                    llm_output = give_feedback(
                        feedback_prompt,
                        solution_proof,
                        student_proof,
                        checker_output,
                        # error_code_explanation,
                    )

                    feedback, hint = postprocess_output(llm_output)
                else:
                    print("No solution is provided for the feedback. Try again.")
                    return None
        except (json.JSONDecodeError, FileNotFoundError, PermissionError) as e:
            print(f"Metadata or solution file error, falling back to solver: {e}")

    def _process_metadata(feedback: str, hint: str):
        """save and return feedback and hint to feedback metadata"""
        metadata = {
            "proof_name": proof_name,
            "feedback_prompt_path": feedback_prompt_path,
            "feedback": feedback,
            "hint": hint,
        }

        metadata_path = os.path.join(original_proof_dir, "feedback_metadata.json")

        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=4)

        print(f"Feedback metadata successfully saved to {metadata_path}")
        return metadata

    metadata = _process_metadata(feedback, hint)
    return metadata


if __name__ == "__main__":
    target_dir = sys.argv[1]
    output = run_feedback_agent(target_dir)
    print(json.dumps(output))
