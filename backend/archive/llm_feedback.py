import os
import subprocess
from dotenv import load_dotenv
from backend.archive.postprocess_output import split_output
from litellm import completion
import re
from pathlib import Path


def give_feedback(system_prompt, input: str) -> str:
    # Use LLM to provide feedback on the proof
    load_dotenv()

    response = completion(
        model="gpt-5.5",
        api_base=os.getenv("OPENAI_API_BASE"),
        api_key=os.getenv("OPENAI_API_KEY"),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": input},
        ],
    )

    print("Successfully got LLM response")
    return response.choices[0].message.content


def run_checker(proof_file):
    command = ["npm", "run", "checkProof", "--", proof_file]
    output = subprocess.run(command, capture_output=True, text=True, check=False)
    if output.stdout:
        print("Successfully got checker output")
        return output.stdout
    else:
        print("Error occurred while running proof checker:")
        print(output.stderr)
        return None


def save_checker_output(proof_name):
    proof_file = "src/checker/proofs/" + proof_name + ".txt"
    proof_result_folder = "backend/" + proof_name
    if not os.path.exists(proof_result_folder):
        os.mkdir(proof_result_folder)
    proof_result_file = "backend/" + proof_name + "/result.txt"
    if not os.path.exists(proof_result_file):
        checker_output = run_checker(proof_file)
        if checker_output:
            with open(proof_result_file, "w", encoding="utf-8") as f:
                f.write(checker_output)
            return checker_output
    else:
        print("Proof result already exists, skipping proof checker.")
        with open(proof_result_file, encoding="utf-8") as f:
            checker_output = f.read()
        return checker_output


def get_feedback_path(
    proof_name: str, prompt_name: str, base_dir: str = "backend"
) -> Path:
    target_dir = Path(base_dir) / proof_name
    target_dir.mkdir(parents=True, exist_ok=True)

    pattern = re.compile(rf"^feedback_{re.escape(prompt_name)}_(\d+)\.txt$")
    max_num = -1

    # Scan the directory for existing files
    for file in target_dir.iterdir():
        if file.is_file():
            match = pattern.match(file.name)
            if match:
                # Extract the number and track the highest one found
                file_num = int(match.group(1))
                if file_num > max_num:
                    max_num = file_num
    next_num = max_num + 1

    new_filename = f"feedback_{prompt_name}_{next_num:02d}.txt"

    return target_dir / new_filename


# s1inc2:quick fix step 5 rhl
# s2inc1: quick fix step 8 and 9 has cycle add step after 7 reflex  -> cog_(LU, UL)

if __name__ == "__main__":
    PROOF = "s1inc2"
    PROMPT = "feedback_hint_answer_prompt2"

    with open("backend/prompt/" + PROMPT + ".txt", encoding="utf-8") as f:
        system_prompt = f.read()

    result = save_checker_output(PROOF)
    print(result)
    with open("src/checker/proofs/" + PROOF + ".txt", encoding="utf-8") as f:
        student_proof = f.read()
    _, _, printed_result = split_output(result)
    feedback = give_feedback(system_prompt, student_proof + printed_result)

    # save feedback in backend/proof_name/prompt_name_feedback_00.txt
    feedback_path = get_feedback_path(PROOF, PROMPT)
    with open(feedback_path, "w", encoding="utf-8") as f:
        f.write(feedback)
