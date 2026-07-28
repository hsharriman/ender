from __future__ import annotations
import argparse
import importlib
import json
import re
import shutil
import subprocess
import sys
from contextlib import chdir
from pathlib import Path
from typing import Any
from dotenv import load_dotenv


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
    metadata_path = image.with_name(f"{image.stem}_metadata.json")

    # Preserve existing metadata and manually completed labels;
    # --refresh-metadata deletes it to force regeneration (for errors)
    if metadata_path.is_file():
        return json.loads(metadata_path.read_text(encoding="utf-8"))

    process_single_image = load_coordinate_runner(coord_dir)
    with chdir(coord_dir):
        process_single_image(str(image), visualize=False)

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

    # Keep every detected point, including structural points not referenced by the proof, so the final declaration preserves the complete diagram
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
    # A refinement can assign proof-compatible names to detected but unlabeled vertices.
    # Keep the original alignment for reference, and use the refined alignment when updating the proof.
    labeled_coordinates = metadata.get(
        "labeled_coordinates_with_refinement",
        metadata["labeled_coordinates"],
    )
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
    *,
    skip_errors: bool = False,
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
        temporary_path: Path | None = None
        try:
            if index not in crops:
                raise RuntimeError("no diagram crop was found for coordinate extraction.")

            final_text = Path(item["raw_path"]).read_text(encoding="utf-8")
            final_text = replace_coordinates_in_proof(
                final_text, crops[index], coordinate_extraction_dir
            )[0]

            final_path = Path(proofs_dir).expanduser().resolve() / filename
            # Check a temporary path (prevents an invalid result from overwriting an existing proof when resume mode writes in place)
            temporary_path = final_path.with_name(f".{final_path.stem}.pending{final_path.suffix}")
            save_text_with_replaced_coordinates(final_text, temporary_path)
            run_ender_checker(temporary_path)
            temporary_path.replace(final_path)
            final_paths.append(final_path)
        except Exception as error:
            if temporary_path is not None:
                temporary_path.unlink(missing_ok=True)
            run_error = RuntimeError(f"{filename}: {error}")
            if not skip_errors:
                raise run_error from error
            print(f"SKIPPED: {run_error}", file=sys.stderr)
    return final_paths


def prepare_proofs(
    proofs_dir: Path,
    diagrams_dir: Path,
    pattern: str,
    refresh_metadata: bool,
) -> tuple[list[dict[str, Any]], dict[int, Path]]:
    """
    Prepare a list of extractable proofs and a mapping of diagram crops.
    If ``refresh_metadata`` is True, delete any existing metadata to force
    regeneration of the coordinate extraction results.
    """
    proof_paths = sorted(proofs_dir.glob(pattern))
    if not proof_paths:
        raise FileNotFoundError(f"No proof files matched {pattern!r} in {proofs_dir}.")
    items: list[dict[str, Any]] = []
    crops: dict[int, Path] = {}
    for index, proof_path in enumerate(proof_paths):
        items.append(
            {
                "status": "extractable",
                "filename": proof_path.name,
                "raw_path": str(proof_path),
            }
        )
        crop_path = diagrams_dir / f"{proof_path.stem}_diagram.png"
        if not crop_path.is_file():
            continue

        crops[index] = crop_path
        if refresh_metadata:
            metadata_path = crop_path.with_name(f"{crop_path.stem}_metadata.json")
            metadata_path.unlink(missing_ok=True)

    return items, crops


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract diagram coordinates and update matching ENDER proofs."
    )
    parser.add_argument(
        "diagrams_dir",
        type=Path,
        help="Directory containing *_diagram.png files.",
    )
    parser.add_argument(
        "proofs_dir",
        type=Path,
        help="Directory containing matching proof files.",
    )
    parser.add_argument(
        "--proof-pattern",
        default="*.txt",
        help="Proof filename pattern (default: *.txt).",
    )
    parser.add_argument(
        "--coordinate-extraction-dir",
        type=Path,
        default=PROJECT_ROOT / "geo-proof-dataset" / "coordinate_extraction",
        help="Coordinate extractor directory.",
    )
    parser.add_argument(
        "--env-path",
        type=Path,
        default=PROJECT_ROOT / "backend" / "extract" / "keys" / ".env",
        help="Credential file used for coordinate label alignment.",
    )
    parser.add_argument(
        "--skip-errors",
        action="store_true",
        help="Report per-proof failures and continue processing.",
    )
    parser.add_argument(
        "--refresh-metadata",
        action="store_true",
        help="Discard existing crop metadata and rerun coordinate extraction.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    load_dotenv(args.env_path.expanduser().resolve(), override=False)

    diagrams_dir = args.diagrams_dir.expanduser().resolve()
    proofs_dir = args.proofs_dir.expanduser().resolve()
    items, crops = prepare_proofs(
        proofs_dir,
        diagrams_dir,
        args.proof_pattern,
        args.refresh_metadata,
    )
    final_paths = finalize_and_save_proofs(
        items,
        crops,
        args.coordinate_extraction_dir,
        proofs_dir,
        skip_errors=args.skip_errors,
    )
    print("\n".join(str(path) for path in final_paths))


if __name__ == "__main__":
    main()
