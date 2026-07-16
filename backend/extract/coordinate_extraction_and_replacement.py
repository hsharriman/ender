from __future__ import annotations

import importlib
import json
import re
import sys
from contextlib import chdir
from pathlib import Path
from typing import Any


def load_coordinate_runner(coordinate_extraction_dir: Path):
    """Load the ``process_single_image`` function from the coordinate extraction module."""
    directory = str(coordinate_extraction_dir)
    if directory not in sys.path:
        sys.path.insert(0, directory)
    module = importlib.import_module("run_coordinate_extraction")
    return module.process_single_image


def collect_images_coordinate(image_path: str | Path, coordinate_extraction_dir: str | Path) -> dict[str, Any]:
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


def replace_point_declaration(text: str, point_declaration: str) -> str:
    """Replace the point declaration inside an ENDER proof.

    The extractor is asked to keep ``pt:`` on one line. This function also
    handles wrapped point lists by removing continuation lines until the next
    known premises declaration or proof marker.
    """
    lines = text.splitlines()
    replacement = normalize_point_declaration(point_declaration)
    start_index: int | None = None
    end_index: int | None = None

    next_field = re.compile(
        r"^\s*(?:seg|ang|tri|quad|circ)\s*:|^\s*\[(?:g|d)_|^\s*->|^\s*steps\s*:",
        flags=re.IGNORECASE,
    )

    for index, line in enumerate(lines):
        if re.match(r"^\s*pt\s*:", line, flags=re.IGNORECASE):
            start_index = index
            end_index = index + 1
            while end_index < len(lines) and not next_field.match(lines[end_index]):
                # Empty lines after the point block should remain outside it.
                if not lines[end_index].strip():
                    break
                end_index += 1
            break

    if start_index is not None and end_index is not None:
        lines[start_index:end_index] = [replacement]
    else:
        for index, line in enumerate(lines):
            if re.match(r"^\s*premises\s*:\s*$", line, flags=re.IGNORECASE):
                lines.insert(index + 1, replacement)
                break

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


def finalize_and_save_proofs(
    items: list[dict[str, Any]],
    crops: dict[int, Path],
    coordinate_extraction_dir: str | Path,
    proofs_dir: str | Path,
) -> list[Path]:
    """
    For each proof item, if it is extractable and has a raw path, replace the
    point declaration in the proof text with the one extracted from the corresponding
    proof diagram image. Save the modified text to the specified proofs directory."""
    final_paths: list[Path] = []
    for index, item in enumerate(items):
        if item.get("status") != "extractable" or not item.get("raw_path"):
            continue
        final_text = Path(item["raw_path"]).read_text(encoding="utf-8")
        if index in crops:
            final_text = replace_coordinates_in_proof(
                final_text, crops[index], coordinate_extraction_dir
            )[0]
        filename = str(item["filename"])
        final_path = save_text_with_replaced_coordinates(
            final_text, Path(proofs_dir) / filename
        )
        final_paths.append(final_path)
    return final_paths
