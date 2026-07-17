from __future__ import annotations
import base64
from io import BytesIO
import json
import mimetypes
import re
from pathlib import Path
from typing import Any
from dotenv import load_dotenv
from PIL import Image

from .llm_call import call_completion


PROJECT_ROOT = Path(__file__).resolve().parents[2]
def parse_json_object(text: str) -> dict[str, Any]:
    """
    Parse a JSON object from the given text.
    Cleaning: Remove code block markers and ensure proper JSON format.
    """
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    if not (cleaned.startswith("{") and cleaned.endswith("}")):
        cleaned = cleaned[cleaned.find("{") : cleaned.rfind("}") + 1]
    return json.loads(cleaned)


def encode_data_url(source: str | Path | Image.Image) -> str:
    """
    Encode a file path or in-memory image as a data URL to send the request for the LLM.
    """
    if isinstance(source, Image.Image):
        buffer = BytesIO()
        source.save(buffer, format="PNG")
        content = buffer.getvalue()
        mime_type = "image/png"
    else:
        file_path = Path(source)
        content = file_path.read_bytes()
        mime_type = (
            mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
        )
    encoded = base64.b64encode(content).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


def image_content_blocks(image_paths: list[str | Path], *, detail: str = "high") -> list[dict]:
    """
    Create a list of content blocks for the LLM request, each containing an image URL and a description."""
    blocks: list[dict] = []
    for page_number, image_path in enumerate(image_paths, start=1):
        blocks.append({"type": "text", "text": f"PDF page {page_number}:"})
        blocks.append(
            {
                "type": "image_url",
                "image_url": {
                    "url": encode_data_url(image_path),
                    "detail": detail,
                },
            }
        )
    return blocks


def build_crop_prompt(config: dict[str, Any], items: list[dict[str, Any]]) -> str:
    """
    Create the text prompt that describes which proof diagrams to find.
    This function loads the crop-prompt template and inserts compact metadata for each extracted proof. 
    It does not send images or call the LLM.
    """
    prompt_path = (PROJECT_ROOT / config["crop_prompt_path"]).resolve()
    prompt = prompt_path.read_text(encoding="utf-8")
    compact_items = []
    for index, item in enumerate(items):
        content = str(item.get("content", ""))
        goal_match = re.search(r"(?m)^\s*->\s*(.+)$", content)
        compact_items.append(
            {
                "item_index": index,
                "filename": item.get("filename", ""),
                "title": item.get("title", ""),
                "goal": goal_match.group(1).strip() if goal_match else "",
                "status": item.get("status", ""),
            }
        )
    return prompt.replace(
        "{items_json}", json.dumps(compact_items, ensure_ascii=False, indent=2)
    )


def locate_diagrams(
    page_images: list[Path],
    items: list[dict[str, Any]],
    config: dict[str, Any],
) -> list[dict[str, Any]]:
    """Ask the vision LLM to locate each proof's diagram on the PDF pages.
    This function combines the text produced by ``build_crop_prompt`` with the
    rendered page images, sends the multimodal request, and returns the parsed
    diagram locations and bounding boxes.
    """
    env_path = (PROJECT_ROOT / config["env_path"]).resolve()
    load_dotenv(env_path, override=False)

    content: list[dict[str, Any]] = [
        {
            "type": "text",
            "text": build_crop_prompt(config, items),
        }
    ]
    content.extend(image_content_blocks(page_images, detail="high"))

    response_text = call_completion(
        config=config,
        model_key="diagram_locator_model",
        messages=[{"role": "user", "content": content}],
    )
    result = parse_json_object(response_text)
    return result.get("diagrams", [])


def normalized_bbox_to_pixels(
    bbox: list[float], width: int, height: int
) -> tuple[int, int, int, int]:
    """
    Convert a normalized bounding box (values between 0 and 1000) to pixel coordinates based on the image dimensions.
    """
    x1, y1, x2, y2 = [float(value) for value in bbox]
    x1, x2 = sorted((max(0.0, x1), min(1000.0, x2)))
    y1, y2 = sorted((max(0.0, y1), min(1000.0, y2)))

    left = max(0, round(width * x1 / 1000))
    top = max(0, round(height * y1 / 1000))
    right = min(width, round(width * x2 / 1000))
    bottom = min(height, round(height * y2 / 1000))
    return left, top, right, bottom


def add_crop_padding(
    bbox: tuple[int, int, int, int],
    width: int,
    height: int,
    padding_ratio: float,
) -> tuple[int, int, int, int]:
    """
    Add proportional padding around a crop box so point labels and endpoints are not clipped.
    """
    left, top, right, bottom = bbox
    padding_x = max(4, round((right - left) * padding_ratio))
    padding_y = max(4, round((bottom - top) * padding_ratio))
    return (
        max(0, left - padding_x),
        max(0, top - padding_y),
        min(width, right + padding_x),
        min(height, bottom + padding_y),
    )


def refine_diagram_crop(
    image: Image.Image,
    item: dict[str, Any],
    config: dict[str, Any],
) -> Image.Image:
    """
    The first part usually crop the part that has the diagram, but it may include some extra parts. 
    This function refines the crop to focus on the diagram itself by using the LLM to analyze the cropped image and the associated item information.
    Returns a new image that is a more precise crop of the diagram.
    """
    prompt_path = (PROJECT_ROOT / config["crop_refinement_prompt_path"]).resolve()
    prompt = prompt_path.read_text(encoding="utf-8").replace(
        "{item_json}", json.dumps(item, ensure_ascii=False, indent=2)
    )
    response_text = call_completion(
        config=config,
        model_key="diagram_crop_refinement_model",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": encode_data_url(image),
                            "detail": "high",
                        },
                    },
                ],
            }
        ],
    )
    bbox = parse_json_object(response_text)["bbox"]
    pixel_bbox = normalized_bbox_to_pixels(bbox, image.width, image.height)
    pixel_bbox = add_crop_padding(
        pixel_bbox,
        image.width,
        image.height,
        float(config["crop_padding_ratio"]),
    )
    return image.crop(pixel_bbox)


def crop_diagrams(
    page_images: list[Path],
    diagram_specs: list[dict[str, Any]],
    items: list[dict[str, Any]],
    output_dir: str | Path,
    config: dict[str, Any],
) -> dict[int, Path]:
    """
    Crop diagrams from the provided page images based on the specifications returned by the LLM.
    There are two parts: first, crop the part that has the diagram, and then refine the crop to focus on the diagram itself.
    Steps:
    1. For each diagram specification, check if the status is "found" and extract the item index, page number, and bounding box.
    2. Open the corresponding page image, convert the normalized bounding box to pixel coordinates, and crop the image.
    3. Refine the crop using the LLM to focus on the diagram itself.
    4. Save the cropped diagram to the specified output directory with a filename based on the item's filename or a default name.
    """
    out = Path(output_dir).expanduser().resolve()
    out.mkdir(parents=True, exist_ok=True)
    crops: dict[int, Path] = {}

    for spec in diagram_specs:
        # Ignore proof items for which the locator did not find a diagram.
        if spec.get("status", "found") != "found":
            continue

        item_index_value = spec.get("item_index")
        page_number_value = spec.get("page")
        bbox = spec.get("bbox")

        if not all(type(value) is int for value in (item_index_value, page_number_value)):
            continue

        item_index = item_index_value
        page_number = page_number_value

        # Validate the box structure before passing its values to float().
        bbox_is_valid = (
            isinstance(bbox, list)
            and len(bbox) == 4
            and all(
                isinstance(coordinate, (int, float))
                and not isinstance(coordinate, bool)
                for coordinate in bbox
            )
        )
        if not bbox_is_valid:
            continue

        # Ensure the locator refers to an available proof item and rendered page.
        if not (0 <= item_index < len(items)):
            continue
        if not (1 <= page_number <= len(page_images)):
            continue

        # Make a generous first crop, refine it with the vision model, and save it.
        page_path = page_images[page_number - 1]
        with Image.open(page_path) as image:
            pixel_bbox = normalized_bbox_to_pixels(bbox, image.width, image.height)
            crop = image.crop(pixel_bbox).convert("RGB")
            crop = refine_diagram_crop(crop, items[item_index], config)
            proof_name = Path(str(items[item_index].get("filename", ""))).stem
            if not proof_name:
                proof_name = f"item_{item_index + 1}"
            output_path = out / f"{proof_name}_diagram.png"
            crop.save(output_path, format="PNG")
        crops[item_index] = output_path

    return crops


def extract_and_crop_diagrams(
    page_images: list[Path],
    items: list[dict[str, Any]],
    output_dir: str | Path,
    config: dict[str, Any],
) -> tuple[dict[int, Path], list[dict[str, Any]]]:
    """
    Extract and crop diagrams from the provided page images and items.
    Returns a tuple containing a dictionary of cropped diagram paths and a list of diagram specifications."""
    specs = locate_diagrams(page_images, items, config)
    crops = crop_diagrams(
        page_images,
        specs,
        items,
        output_dir,
        config,
    )
    return crops, specs
