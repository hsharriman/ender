import os
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


if __name__ == "__main__":
    PROOF = "s2inc1"
    SOLVER_PROMPT = "solver_with_valid_reasons"
    FEEDBACK_PROMPT = "feedback"

    try:
        solution_proof = run_solver_agent(PROOF, SOLVER_PROMPT)
    except ValueError as error:
        print(f"Solver failed: {error}")

    with open(f"backend/prompt/{FEEDBACK_PROMPT}.txt", encoding="utf-8") as f:
        feedback_prompt = f.read()
    with open("src/checker/proofs/" + PROOF + ".txt", encoding="utf-8") as f:
        student_proof = f.read()
    with open("backend/" + PROOF + "/result.txt", encoding="utf-8") as f:
        checker_output = f.read()

    print(give_feedback(feedback_prompt, solution_proof, student_proof, checker_output))
