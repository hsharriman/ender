import difflib
import re
import json


def remove_reason_params(solution: str) -> str:
    """Return solutions without reason parameters"""

    def remove_params(match):
        prefix = match.group(1)  # e.g., "[03] "
        reason = match.group(2)  # e.g., "con_supplements_same(1,2)"
        suffix = match.group(3)  # e.g., " -> con_ang(a_ABC,a_DBA)"

        # Strip out anything inside parentheses and the parentheses themselves
        clean_reason = re.sub(r"\(.*?\)", "", reason)

        return f"{prefix}{clean_reason}{suffix}"

    # Pattern matches step lines: [step_num] reason -> ...
    pattern = r"(^\s*\[\d+\]\s*)(.+?)(\s*->.*$)"

    return re.sub(pattern, remove_params, solution, flags=re.MULTILINE)


def _process_checker_output(checker_output_text: str) -> dict:
    json_match = re.search(r"\{.*\}", checker_output_text, re.DOTALL)

    if not json_match:
        raise ValueError("No JSON payload found in the checker output.")

    return json.loads(json_match.group(0))


def remove_checker_dependencies(checker_output_text: dict) -> dict:
    """Removes target keys('ref', 'argIndex', 'index', 'dependsOn') from any error 'details'."""
    checker_output = _process_checker_output(checker_output_text)

    keys_to_remove = {"ref", "argIndex", "index", "dependsOn"}

    for error in checker_output.get("issues", []):
        if "details" in error and isinstance(error["details"], dict):
            for key in keys_to_remove:
                error["details"].pop(key, None)

    return checker_output


def extract_error_code_explanation(checker_output_text: str) -> str:
    """Returns a targeted markdown explanations for the error codes in the checker output."""
    checker_output = _process_checker_output(checker_output_text)
    with open("src/checker/ERROR_CODES.md", encoding="utf-8") as f:
        md_content = f.read()

    errors = checker_output.get("issues", [])
    error_codes = {err["code"] for err in errors if "code" in err}

    if not error_codes:
        return "No errors found in the checker output."

    table_matches = re.findall(r"\|\s*`([^`]+)`\s*\|\s*(.*?)\s*\|", md_content)
    code_explanations = {code: exp for code, exp in table_matches}

    output_lines = []
    found_any = False

    for code in error_codes:
        explanation = code_explanations.get(code)
        if explanation:
            output_lines.append(f"* **`{code}`**: {explanation}")
            found_any = True
        else:
            output_lines.append(
                f"* **`{code}`**: (No explanation found in documentation)"
            )

    if not found_any:
        return "No matching error code explanations found in documentation."

    return "\n".join(output_lines)


def find_solution_changes(old_solution: str, new_solution: str):
    """Compares the two solutions and return word-level differences."""
    words1 = old_solution.split()
    words2 = new_solution.split()

    matcher = difflib.SequenceMatcher(None, words1, words2)
    diffs = ""
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        old_part = " ".join(words1[i1:i2])
        new_part = " ".join(words2[j1:j2])

        if tag == "replace":
            diffs += f"'{old_part}' should be changed into '{new_part}'"
        elif tag == "delete":
            diffs += f"'{old_part}' should be deleted"
        elif tag == "insert":
            diffs += f"'{new_part}' should be added"
    return diffs
