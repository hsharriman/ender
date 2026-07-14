import os
import re
import json
import requests
from pathlib import Path
from dotenv import load_dotenv
from litellm import completion


def run_solver(system_prompt, input: str) -> str:
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
    checker_url = os.getenv("CHECKER_URL", "http://localhost:4000")
    with open(proof_file, "r", encoding="utf-8") as f:
        proof_text = f.read()
    try:
        response = requests.post(
            f"{checker_url}/check",
            json={"text": proof_text},
            timeout=30,
        )
        response.raise_for_status()
        print("Successfully got checker output")
        return json.dumps(response.json(), indent=2)
    except requests.RequestException as e:
        print(f"Proof checker service error: {e}")
        return json.dumps(
            {
                "isCorrect": False,
                "errors": [
                    {
                        "type": "UnclassifiedError",
                        "code": "checker_unavailable",
                        "details": {"msg": str(e)},
                    }
                ],
            },
            indent=2,
        )


def save_checker_output_for_file(proof_file, work_dir, use_cache=True):
    os.makedirs(work_dir, exist_ok=True)
    proof_result_file = os.path.join(work_dir, "result.txt")
    if use_cache and os.path.exists(proof_result_file):
        print("Proof result already exists, skipping proof checker.")
        with open(proof_result_file, encoding="utf-8") as f:
            return f.read()
    checker_output = run_checker(proof_file)
    if checker_output:
        with open(proof_result_file, "w", encoding="utf-8") as f:
            f.write(checker_output)
        return checker_output


def save_checker_output(proof_name):
    return save_checker_output_for_file(
        "src/checker/proofs/" + proof_name + ".txt", "backend/" + proof_name
    )


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


def get_fixed_proof(proof_file, work_dir, str_output):
    json_output = json.loads(str_output)
    solution = json_output[0]["solution"]
    fixed_step = solution[:4]

    with open(proof_file, "r") as f:
        proof = f.read()
    student_proof = proof.split(fixed_step)[0].strip()

    fixed_proof = student_proof + "\n" + solution
    with open(os.path.join(work_dir, "fixed_solution.txt"), "w") as f:
        f.write(fixed_proof)
    return fixed_proof


def run_solver_agent_for_file(proof_file, prompt, work_dir, loop_times_max=5):
    # Get system prompt
    with open("backend/prompt/" + prompt + ".txt", encoding="utf-8") as f:
        system_prompt = f.read()

    # Append valid reasons and statements to the system prompt
    with open("src/checker/grammar/defs/reasons.defs.ts", "r", encoding="utf-8") as f:
        valid_reasons = f.read()
    with open("src/checker/grammar/defs/stmts.defs.ts", "r", encoding="utf-8") as f:
        valid_statements = f.read()
    system_prompt = f"{system_prompt}\nValid reasons: {valid_reasons}\n\
        Valid statements: {valid_statements}"

    # Get checker output
    checker_output = save_checker_output_for_file(proof_file, work_dir)
    with open(proof_file, encoding="utf-8") as f:
        student_proof = f.read()
    # _, _, checker_result = split_output(result)

    # Run solution loop
    is_solution_correct = False
    loop_times = 0
    while not is_solution_correct and loop_times <= loop_times_max:
        loop_times += 1
        print(f"-----------------loop {loop_times}----------------")
        # Get LLM solution
        llm_solution = run_solver(system_prompt, student_proof + checker_output)
        fixed_proof = get_fixed_proof(proof_file, work_dir, llm_solution)
        print("---------fixed proof---------")
        print(fixed_proof)

        # Validate solution
        print("---------checker output---------")
        checker_output = run_checker(os.path.join(work_dir, "fixed_solution.txt"))
        print(checker_output)

        if json.loads(checker_output).get("isCorrect"):
            is_solution_correct = True
            print(
                f"Correct solution found in {loop_times} trial(s). Solution loop completed"
            )
            return fixed_proof
        else:
            # run llm again
            print("Solution is incorrect, running the loop again ")
            student_proof = fixed_proof
    raise ValueError("The correct solution was never reached.")


def run_solver_agent(PROOF, PROMPT, LOOP_TIMES=5):
    return run_solver_agent_for_file(
        "src/checker/proofs/" + PROOF + ".txt", PROMPT, "backend/" + PROOF, LOOP_TIMES
    )


if __name__ == "__main__":
    PROOF = "s2inc1"
    PROMPT = "solver_with_valid_reasons_and_explanation"
    try:
        solution = run_solver_agent(PROOF, PROMPT)
    except ValueError as error:
        print(f"Solver failed: {error}")
