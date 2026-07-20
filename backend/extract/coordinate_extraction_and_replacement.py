from __future__ import annotations

import importlib
import json
import re
import shutil
import subprocess
import sys
from contextlib import chdir
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[2]


def load_coordinate_runner(coordinate_extraction_dir: Path):
    """Load the ``process_single_image`` function from the coordinate extraction module."""
    directory = str(coordinate_extraction_dir)
    if directory not in sys.path:
        sys.path.insert(0, directory)
    module = importlib.import_module("run_coordinate_extraction")
    return module.process_single_image


def collect_images_coordinate(
    image_path: str | Path,
    coordinate_extraction_dir: str | Path,
) -> dict[str, Any]:
    """Run ``coordinate_extraction.process_single_image`` and return metadata."""
    image = Path(image_path).expanduser().resolve()
    coord_dir = Path(coordinate_extraction_dir).expanduser().resolve()

    process_single_image = load_coordinate_runner(coord_dir)
    with chdir(coord_dir):
        process_single_image(str(image), visualize=False)

    metadata_path = image.with_name(f"{image.stem}_metadata.json")
    return json.loads(metadata_path.read_text(encoding="utf-8"))


def normalize_point_declaration(labeled_coordinates: str) -> str:
    """Normalize the point declaration extracted from a proof diagram image.
    1. Remove any leading or trailing whitespace and code block markers.
    2. Extract the point declaration after ``pt:`` if present, otherwise use the
    entire declaration.
    3. Normalize whitespace and commas, and ensure that function calls have a space
    between the function name and the opening parenthesis.
    4. Return the normalized point declaration prefixed with ``pt:``.
    """
    declaration = labeled_coordinates.strip()
    declaration = re.sub(r"^```(?:text)?\s*", "", declaration, flags=re.IGNORECASE)
    declaration = re.sub(r"\s*```$", "", declaration).strip()

    match = re.search(r"(?is)\bpt\s*:\s*(.+)$", declaration)
    if match:
        points = re.sub(r"\s+", " ", match.group(1)).strip()
    else:
        points = re.sub(r"\s+", " ", declaration).strip()
    points = re.sub(r"\s*,\s*", ", ", points)
    points = re.sub(r"\b([A-Za-z][A-Za-z0-9_]*)\s*\(", r"\1 (", points)
    return "pt: " + points


def find_point_declaration_range(lines: list[str]) -> tuple[int, int] | None:
    """Return the start and exclusive end indexes of a proof's ``pt:`` block."""
    next_premise_field_pattern = re.compile(
        r"^\s*(?:seg|ang|tri|quad|circ)\s*:"
        r"|^\s*\[(?:g|d)_"
        r"|^\s*->"
        r"|^\s*steps\s*:",
        flags=re.IGNORECASE,
    ) # Matches the next known premises declaration or proof marker.

    for index, line in enumerate(lines):
        if not re.match(r"^\s*pt\s*:", line, flags=re.IGNORECASE):
            continue
        end_index = index + 1
        while end_index < len(lines) and not next_premise_field_pattern.match(lines[end_index]):
            # Empty lines after the point block remain outside the declaration.
            if not lines[end_index].strip():
                break
            end_index += 1
        return index, end_index
    return None


def extract_point_labels(point_declaration: str) -> set[str]:
    """Extract point labels from coordinate-based or bare ``pt:`` declarations."""
    normalized_declaration = normalize_point_declaration(point_declaration)
    points = normalized_declaration.partition(":")[2]
    point_label_pattern = re.compile(
        r"(?:^|,)\s*([A-Za-z][A-Za-z0-9_]*)"
        r"(?=\s*(?:\(|,|$))"
    ) # Matches point labels that are either followed by a function call or a comma, and ignores any whitespace.
    return set(point_label_pattern.findall(points))


def replace_point_declaration(text: str, point_declaration: str) -> str:
    """Validate and replace the complete point declaration in an ENDER proof.

    The extractor is asked to keep ``pt:`` on one line. This function also
    handles wrapped point lists by removing continuation lines until the next
    known premises declaration or proof marker. Replacement is rejected when
    coordinate extraction omits any point declared in the original proof.
    """
    lines = text.splitlines()
    replacement = normalize_point_declaration(point_declaration)
    declaration_range = find_point_declaration_range(lines)
    # If the original proof has no ``pt:`` declaration, we cannot replace it
    if declaration_range is None:
        raise ValueError(
            "Cannot replace coordinates because the extracted proof has no pt: declaration."
        )

    start_index, end_index = declaration_range
    original_declaration = " ".join(lines[start_index:end_index])
    required_labels = extract_point_labels(original_declaration)
    # If the original proof has no recognizable points, we cannot validate the replacement
    if not required_labels:
        raise ValueError(
            "The extracted proof's pt: declaration contains no recognizable points."
        )

    detected_labels = extract_point_labels(replacement)
    missing_labels = required_labels - detected_labels
    if missing_labels:
        missing_text = ", ".join(sorted(missing_labels))
        detected_text = ", ".join(sorted(detected_labels)) or "none"
        raise ValueError(
            "Coordinate extraction is missing proof point(s): "
            f"{missing_text}. Detected point(s): {detected_text}."
        )

    # Keep every detected point, including structural points not referenced by
    # the proof, so the final declaration preserves the complete diagram.
    lines[start_index:end_index] = [replacement]

    return "\n".join(lines).rstrip() + "\n"


def replace_coordinates_in_proof(
    text: str,
    image_path: str | Path,
    coordinate_extraction_dir: str | Path,
) -> tuple[str, dict[str, Any]]:
    """
    Find the point declaration in a proof text and replace it with the
    point declaration extracted from the corresponding proof diagram image."""
    metadata = collect_images_coordinate(image_path, coordinate_extraction_dir)
    labeled_coordinates = metadata["labeled_coordinates"]
    return replace_point_declaration(text, labeled_coordinates), metadata


def save_text_with_replaced_coordinates(text: str, output_path: str | Path) -> Path:
    """Save the text with replaced coordinates to the specified output path."""
    output = Path(output_path).expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(text, encoding="utf-8")
    return output


def run_ender_checker(
    proof_path: str | Path,
    project_root: str | Path = PROJECT_ROOT,
) -> dict[str, Any]:
    """Run the ENDER checker and return its successful JSON result."""
    proof = Path(proof_path).expanduser().resolve()
    root = Path(project_root).expanduser().resolve()
    npm_executable = shutil.which("npm") or shutil.which("npm.cmd")
    # Debugging note
    if not npm_executable:
        raise RuntimeError("Cannot execute the ENDER checker: npm was not found.") # For cannot find npm
    # Try to run the checker and parse its output as JSON. If it fails, raise an error with details.
    try:
        completed = subprocess.run(
            [npm_executable, "--silent", "run", "checkProof", "--", str(proof)],
            cwd=root,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            check=False,
        )
        result = json.loads(completed.stdout)
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError("Cannot execute or read the ENDER checker.") from error

    if not isinstance(result, dict) or completed.returncode != 0 or result.get("isCorrect") is not True:
        details = result.get("errors", result.get("issues", [])) if isinstance(result, dict) else result
        raise RuntimeError(f"ENDER checker rejected {proof.name}: " + json.dumps(details, ensure_ascii=False))

    return result


def finalize_and_save_proofs(
    items: list[dict[str, Any]],
    crops: dict[int, Path],
    coordinate_extraction_dir: str | Path,
    proofs_dir: str | Path,
) -> list[Path]:
    """
    For each extractable item, require a diagram crop, replace the complete
    point declaration with detected coordinates, save the final proof, and run
    the ENDER checker. Any missing crop, missing point, or checker failure stops
    finalization with a descriptive error.
    """
    final_paths: list[Path] = []
    for index, item in enumerate(items):
        if item.get("status") != "extractable" or not item.get("raw_path"):
            continue
        filename = str(item["filename"])
        if index not in crops:
            raise RuntimeError(
                f"{filename}: no diagram crop was found for coordinate extraction."
            )

        final_text = Path(item["raw_path"]).read_text(encoding="utf-8")
        try:
            final_text = replace_coordinates_in_proof(
                final_text, crops[index], coordinate_extraction_dir
            )[0]
        except ValueError as error:
            raise ValueError(f"{filename}: {error}") from error

        final_path = save_text_with_replaced_coordinates(final_text, Path(proofs_dir) / filename)
        run_ender_checker(final_path)
        final_paths.append(final_path)
    return final_paths
