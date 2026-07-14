import json
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify
from dotenv import load_dotenv
from solver_agent import (
    run_solver_agent,
    run_solver_agent_for_file,
    save_checker_output,
    save_checker_output_for_file,
)
from feedback_agent import give_feedback

load_dotenv()

app = Flask(__name__)

# Root of the geo-proof-dataset volume (mounted at /data in docker compose).
PROOF_DATA_DIR = Path(os.getenv("PROOF_DATA_DIR", "/data")).resolve()
# .txt files in the dataset that are pipeline artifacts, not proofs.
NON_PROOF_TXT_FILES = {"checker_output.txt", "feedback.txt", "result.txt", "fixed_solution.txt"}


def resolve_dataset_path(rel_path):
    """Resolve a dataset-relative path, rejecting traversal outside PROOF_DATA_DIR."""
    if not rel_path:
        return None
    resolved = (PROOF_DATA_DIR / rel_path).resolve()
    if not resolved.is_relative_to(PROOF_DATA_DIR):
        return None
    return resolved


@app.get("/dataset/tree")
def dataset_tree():
    if not PROOF_DATA_DIR.is_dir():
        return (
            jsonify({"error": f"proof data directory not found: {PROOF_DATA_DIR}"}),
            503,
        )

    def walk(directory):
        dirs = []
        proofs = []
        for entry in sorted(directory.iterdir(), key=lambda e: e.name.lower()):
            if entry.name.startswith("."):
                continue
            if entry.is_dir():
                node = walk(entry)
                if node["dirs"] or node["proofs"]:
                    dirs.append(node)
            elif entry.suffix == ".txt" and entry.name not in NON_PROOF_TXT_FILES:
                proofs.append(
                    {
                        "name": entry.stem,
                        "path": str(entry.relative_to(PROOF_DATA_DIR)),
                        "hasFeedback": (entry.parent / "feedback.txt").is_file(),
                    }
                )
        return {
            "name": directory.name,
            "path": "" if directory == PROOF_DATA_DIR else str(directory.relative_to(PROOF_DATA_DIR)),
            "dirs": dirs,
            "proofs": proofs,
        }

    return jsonify(walk(PROOF_DATA_DIR))


@app.get("/dataset/proof")
def dataset_proof():
    proof_file = resolve_dataset_path(request.args.get("path"))
    if not proof_file or not proof_file.is_file():
        return jsonify({"error": "proof not found"}), 404
    feedback_file = proof_file.parent / "feedback.txt"
    return jsonify(
        {
            "path": str(proof_file.relative_to(PROOF_DATA_DIR)),
            "text": proof_file.read_text(encoding="utf-8"),
            "feedback": (
                feedback_file.read_text(encoding="utf-8")
                if feedback_file.is_file()
                else None
            ),
        }
    )


@app.post("/dataset/feedback")
def dataset_feedback():
    data = request.get_json() or {}
    rel_path = data.get("path")
    solver_prompt = data.get("solverPrompt", "solver_with_valid_reasons")
    feedback_prompt_name = data.get("feedbackPrompt", "feedback")
    proof_file = resolve_dataset_path(rel_path)
    if not proof_file or not proof_file.is_file():
        return jsonify({"error": "proof not found"}), 404

    work_dir = os.path.join(
        "backend", "dataset_runs", re.sub(r"[^A-Za-z0-9._-]", "__", rel_path)
    )
    try:
        student_proof = proof_file.read_text(encoding="utf-8")
        checker_output = save_checker_output_for_file(
            str(proof_file), work_dir, use_cache=False
        )
        solution_proof = run_solver_agent_for_file(
            str(proof_file), solver_prompt, work_dir
        )
        with open(f"backend/prompt/{feedback_prompt_name}.txt", encoding="utf-8") as f:
            feedback_prompt = f.read()
        result = give_feedback(
            feedback_prompt, solution_proof, student_proof, checker_output
        )
    except ValueError as e:
        return jsonify({"error": str(e)}), 422

    # The feedback prompt asks for a JSON list: [{step, feedback, hint}].
    step = feedback = hint = None
    try:
        parsed = json.loads(result)
        entry = parsed[0] if isinstance(parsed, list) and parsed else parsed
        if isinstance(entry, dict):
            step = entry.get("step")
            feedback = entry.get("feedback")
            hint = entry.get("hint")
    except (json.JSONDecodeError, TypeError):
        pass

    lines = [text for text in (feedback, f"Hint: {hint}" if hint else None) if text]
    feedback_text = "\n\n".join(lines) if lines else (result or "").strip()
    if feedback_text:
        (proof_file.parent / "feedback.txt").write_text(
            feedback_text, encoding="utf-8"
        )
    return jsonify(
        {
            "step": step,
            "feedback": feedback,
            "hint": hint,
            "feedbackText": feedback_text,
        }
    )


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
