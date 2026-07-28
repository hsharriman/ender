import subprocess
import re
import ast


def split_output(output_text):
    start_idx = output_text.find("{")
    if start_idx == -1:
        raise ValueError("Ender output does not contain \{\}")

    brace_count = 0
    end_idx = -1

    # Scan from the first '{' to find its matching closing '}'
    for i in range(start_idx, len(output_text)):
        if output_text[i] == "{":
            brace_count += 1
        elif output_text[i] == "}":
            brace_count -= 1

        if brace_count == 0:
            end_idx = i
            break
    # Extra text strings
    text_before = output_text[:start_idx].strip()
    text_after = output_text[end_idx + 1 :].strip()
    obj_str = output_text[start_idx : end_idx + 1]

    return text_before, obj_str, text_after


def object_to_dict(obj_str):
    # remove ansi escape characters
    ansi_escape = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")
    clean_obj_str = ansi_escape.sub("", obj_str)

    # Quote the unquoted keys (e.g., proof: -> "proof":) that is not in a string
    def fix_keys(match):
        if match.group(1):
            return match.group(1)
        return f'"{match.group(2)}":'

    pattern = r"('[^']*')|\b(\w+)\s*:"
    clean_obj_str = re.sub(pattern, fix_keys, clean_obj_str)

    clean_obj_str = clean_obj_str.replace("'", '"')

    clean_obj_str = (
        clean_obj_str.replace("true", "True")
        .replace("false", "False")
        .replace("null", "None")
        .replace("undefined", "None")
        .replace("=>", ":")
    )

    # remove Map() and Set()
    clean_obj_str = re.sub(r"Map(?:\(\d+\))?\s*\{", "{", clean_obj_str)
    clean_obj_str = re.sub(r"Set(?:\(\d+\))?\s*\{", "{", clean_obj_str)

    obj_dict = ast.literal_eval(clean_obj_str)

    return obj_dict


if __name__ == "__main__":
    PROOF_FILE = "src/checker/proofs/s2inc1.txt"
    command = ["npm", "run", "checkProof", "--", PROOF_FILE]
    output = subprocess.run(command, capture_output=True, text=True, check=False)
    text = output.stdout
    text_before, obj_str, text_after = split_output(text)
    obj_dict = object_to_dict(obj_str)

    print(f"\n{'-'*10}PROOF TITLE{'-'*10}")
    print(obj_dict["proof"]["title"])
    print(f"\n{'-'*10}   RESULT  {'-'*10}")
    print(text_after)
