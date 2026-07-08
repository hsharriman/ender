import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify
from dotenv import load_dotenv
from solver_agent import run_solver_agent, save_checker_output
from feedback_agent import give_feedback

load_dotenv()

app = Flask(__name__)


@app.post("/solve")
def solve():
    data = request.get_json()
    proof_name = data.get("proofName") if data else None
    prompt = (data or {}).get("prompt", "solver_with_valid_reasons_and_explanation")
    if not proof_name:
        return jsonify({"error": "proofName is required"}), 400
    try:
        solution = run_solver_agent(proof_name, prompt)
        return jsonify({"solution": solution})
    except ValueError as e:
        return jsonify({"error": str(e)}), 422


@app.post("/feedback")
def feedback():
    data = request.get_json()
    proof_name = data.get("proofName") if data else None
    solver_prompt = (data or {}).get("solverPrompt", "solver_with_valid_reasons")
    feedback_prompt_name = (data or {}).get("feedbackPrompt", "feedback")
    if not proof_name:
        return jsonify({"error": "proofName is required"}), 400
    try:
        solution_proof = run_solver_agent(proof_name, solver_prompt)
        with open(f"backend/prompt/{feedback_prompt_name}.txt", encoding="utf-8") as f:
            feedback_prompt = f.read()
        with open(f"src/checker/proofs/{proof_name}.txt", encoding="utf-8") as f:
            student_proof = f.read()
        checker_output = save_checker_output(proof_name)
        result = give_feedback(feedback_prompt, solution_proof, student_proof, checker_output)
        return jsonify({"feedback": result})
    except ValueError as e:
        return jsonify({"error": str(e)}), 422


@app.get("/health")
def health():
    return "ok"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=False)
