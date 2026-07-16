import sys
from pathlib import Path

from .coordinate_extraction_and_replacement import finalize_and_save_proofs
from .crop_diagram_agent import extract_and_crop_diagrams
from .pdf_to_ender_agent import extract_ender_from_pdf, load_config


PROJECT_ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = Path(__file__).parent / "configs" / "config.json"


def main() -> None:
    pdf_path = Path(sys.argv[1]).expanduser().resolve()
    config = load_config(CONFIG_PATH)
    output_dir = (
        Path(sys.argv[2]).expanduser().resolve()
        if len(sys.argv) > 2
        else (PROJECT_ROOT / config["intermediate_run_output_dir"]).resolve()
    )
    run_dir = output_dir / pdf_path.stem

    page_images, items = extract_ender_from_pdf(pdf_path, config, run_dir / "pages", run_dir / "raw")
    crops = extract_and_crop_diagrams(
        page_images, items, PROJECT_ROOT / config["cropped_diagram_output_dir"], config
    )[0]
    final_paths = finalize_and_save_proofs(
        items,
        crops,
        PROJECT_ROOT / config["coordinate_extraction_code_dir"],
        PROJECT_ROOT / config["final_proof_output_dir"],
    )
    print("\n".join(str(path) for path in final_paths))


if __name__ == "__main__":
    main()
