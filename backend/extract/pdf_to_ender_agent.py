from __future__ import annotations

import base64
import json
import mimetypes
import re
from pathlib import Path
from typing import Any
import fitz
from dotenv import load_dotenv

from .llm_call import call_completion



PROJECT_ROOT = Path(__file__).resolve().parents[2]


def parse_json_object(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    if not (cleaned.startswith("{") and cleaned.endswith("}")):
        cleaned = cleaned[cleaned.find("{") : cleaned.rfind("}") + 1]
    return json.loads(cleaned)


def render_pdf_pages(
    pdf_path: str | Path,
    output_dir: str | Path,
    *,
    dpi: int = 220,
) -> list[Path]:
    pdf = Path(pdf_path).expanduser().resolve()
    out = Path(output_dir).expanduser().resolve()
    out.mkdir(parents=True, exist_ok=True)
    matrix = fitz.Matrix(dpi / 72.0, dpi / 72.0)
    page_paths: list[Path] = []
    with fitz.open(pdf) as document:
        for page_index, page in enumerate(document):
            page_path = out / f"page_{page_index + 1:04d}.png"
            page.get_pixmap(matrix=matrix, alpha=False).save(page_path)
            page_paths.append(page_path)
    return page_paths


def extract_pdf_text(pdf_path: str | Path, *, max_chars: int = 120_000) -> str:
    pdf = Path(pdf_path).expanduser().resolve()
    chunks: list[str] = []
    total = 0
    with fitz.open(pdf) as document:
        for page_number, page in enumerate(document, start=1):
            page_text = page.get_text("text").strip()
            if not page_text:
                continue
            chunk = f"--- PDF page {page_number} text ---\n{page_text}"
            remaining = max_chars - total
            if remaining <= 0:
                break
            chunks.append(chunk[:remaining])
            total += len(chunks[-1])
    return "\n\n".join(chunks)


def encode_file_data_url(path: str | Path) -> str:
    file_path = Path(path)
    mime_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
    encoded = base64.b64encode(file_path.read_bytes()).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


def image_content_blocks(image_paths: list[str | Path], *, detail: str = "high") -> list[dict]:
    blocks: list[dict] = []
    for page_number, image_path in enumerate(image_paths, start=1):
        blocks.append({"type": "text", "text": f"PDF page {page_number}:"})
        blocks.append(
            {
                "type": "image_url",
                "image_url": {
                    "url": encode_file_data_url(image_path),
                    "detail": detail,
                },
            }
        )
    return blocks


def read_text_file(file_path: str | Path) -> str:
    return Path(file_path).read_text(encoding="utf-8")


def load_config(config_path: str | Path) -> dict[str, Any]:
    path = Path(config_path).expanduser().resolve()
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def read_examples(example_paths: list[Path]) -> str:
    chunks = []
    for example_path in example_paths:
        if example_path.is_file():
            chunks.append(example_path.read_text(encoding="utf-8"))
    return "\n\n".join(chunks)


def build_prompt(config: dict[str, Any]) -> str:
    prompt_path = (PROJECT_ROOT / config["prompt_path"]).resolve()
    stmts_path = (PROJECT_ROOT / config["stmts_defs"]).resolve()
    reasons_path = (PROJECT_ROOT / config["reasons_defs"]).resolve()

    example_paths = [
        (PROJECT_ROOT / path).resolve() for path in config["example_files"]
    ]
    examples = read_examples(example_paths)
    definitions = (
        "STATEMENT DEFINITIONS:\n"
        + read_text_file(stmts_path)
        + "\n\nREASON DEFINITIONS:\n"
        + read_text_file(reasons_path)
    )

    template = read_text_file(prompt_path)
    return template.replace("{examples}", examples).replace("{defs}", definitions)


def build_input(page_images: list[Path], *, extracted_text: str = "") -> list[dict[str, Any]]:
    instruction = (
        "Extract the proof or proofs from these rendered PDF pages. "
        "Page images appear in order. Return only the requested JSON object."
    )
    if extracted_text:
        instruction += (
            "\n\nThe PDF's embedded text is included below as supplemental context. "
            "Use the page images as the authority for diagrams, symbols, and layout.\n\n"
            + extracted_text
        )
    content: list[dict[str, Any]] = [
        {
            "type": "text",
            "text": instruction,
        }
    ]
    content.extend(image_content_blocks(page_images, detail="high"))
    return content


def run_llm_agent(
    input_path: str | Path,
    config: dict[str, Any],
    *,
    page_images: list[Path] | None = None,
    render_dir: str | Path | None = None,
) -> dict[str, Any]:
    """Extract raw ENDER proof text from a PDF."""
    pdf_path = Path(input_path).expanduser().resolve()
    if page_images is None:
        render_output = Path(render_dir or pdf_path.parent / f"{pdf_path.stem}_pages")
        page_images = render_pdf_pages(
            pdf_path,
            render_output,
            dpi=int(config["render_dpi"]),
        )

    env_path = config["env_path"]
    load_dotenv((PROJECT_ROOT / env_path).resolve(), override=False)

    response_text = call_completion(
        config=config,
        model_key="pdf_to_ender_model",
        messages=[
            {"role": "system", "content": build_prompt(config)},
            {
                "role": "user",
                "content": build_input(
                    page_images,
                    extracted_text=extract_pdf_text(
                        pdf_path,
                        max_chars=int(config["max_pdf_text_chars"]),
                    ),
                ),
            },
        ],
    )
    result = parse_json_object(response_text)
    return result


def clean_filename(name: str, fallback: str = "extracted_proof.txt") -> str:
    cleaned = name.replace("\\", "/").split("/")[-1]
    cleaned = re.sub(r"[^A-Za-z0-9_.-]+", "_", cleaned).strip("._")
    if not cleaned:
        cleaned = fallback
    if not cleaned.lower().endswith(".txt"):
        cleaned += ".txt"
    return cleaned


def clean_proof(text: str) -> str:
    proof = text.strip()
    proof = re.sub(r"^```[a-zA-Z]*\s*", "", proof)
    proof = re.sub(r"\s*```$", "", proof).strip()
    if proof and not proof.startswith("// pass"):
        proof = "// pass\n" + proof
    return proof.rstrip() + "\n"


def save_raw_outputs(
    result: dict[str, Any],
    output_dir: str | Path,
) -> list[dict[str, Any]]:
    raw_dir = Path(output_dir).expanduser().resolve()
    raw_dir.mkdir(parents=True, exist_ok=True)

    saved: list[dict[str, Any]] = []
    used_names: set[str] = set()
    for index, item in enumerate(result["items"]):
        row = dict(item)
        if item.get("status") == "extractable" and item.get("content"):
            filename = clean_filename(
                str(item.get("filename", "")),
                fallback=f"extracted_{index + 1}.txt",
            )
            original = Path(filename)
            suffix_index = 2
            while filename.lower() in used_names:
                filename = f"{original.stem}_{suffix_index}{original.suffix}"
                suffix_index += 1
            used_names.add(filename.lower())
            path = raw_dir / filename
            path.write_text(clean_proof(str(item["content"])), encoding="utf-8")
            row["filename"] = filename
            row["raw_path"] = str(path)
        else:
            row["raw_path"] = ""
        saved.append(row)
    return saved


def extract_ender_from_pdf(
    input_path: str | Path,
    config: dict[str, Any],
    pages_dir: str | Path,
    raw_dir: str | Path,
) -> tuple[list[Path], list[dict[str, Any]]]:
    pdf_path = Path(input_path).expanduser().resolve()
    page_images = render_pdf_pages(
        pdf_path, pages_dir, dpi=int(config["render_dpi"])
    )
    result = run_llm_agent(pdf_path, config, page_images=page_images)
    return page_images, save_raw_outputs(result, raw_dir)
