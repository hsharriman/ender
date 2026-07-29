import argparse
import re
from pathlib import Path

from .coordinate_extraction_and_replacement import finalize_and_save_proofs
from .crop_diagram_agent import extract_and_crop_diagrams
from .pdf_to_ender_agent import (
    extract_ender_from_pdf,
    load_config,
    render_pdf_pages,
)


PROJECT_ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = Path(__file__).parent / "configs" / "config.json"


def load_existing_proofs(proofs_dir: Path, pattern: str) -> list[dict[str, str]]:
    """Build crop/finalization items from existing ENDER proof files."""
    proof_paths = sorted(proofs_dir.glob(pattern))
    if not proof_paths:
        raise FileNotFoundError(
            f"No existing proof files matched {pattern!r} in {proofs_dir}."
        )
    return [
        {
            "status": "extractable",
            "filename": path.name,
            "title": path.stem,
            "content": path.read_text(encoding="utf-8"),
            "raw_path": str(path.resolve()),
        }
        for path in proof_paths
    ]


def find_proof_pattern(pdf_path: Path) -> str:
    """Infer ``holt_s<chapter>-*.txt`` from a chapter PDF filename."""
    match = re.search(r"chapter[_ -]?(\d+)", pdf_path.stem, flags=re.IGNORECASE)
    if not match:
        raise ValueError(
            "Cannot infer the proof filenames from the PDF name. "
            "Pass --proof-pattern explicitly."
        )
    return f"holt_s{match.group(1)}-*.txt"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the ENDER extraction pipeline.")
    parser.add_argument("pdf", type=Path, help="Source textbook PDF")
    parser.add_argument(
        "output_dir",
        type=Path,
        nargs="?",
        help="Optional intermediate output directory",
    )
    parser.add_argument(
        "--existing-proofs-dir",
        type=Path,
        help=(
            "Skip proof-text extraction and use existing .txt proofs from this "
            "directory. Coordinate-replaced proofs are written back in place."
        ),
    )
    parser.add_argument(
        "--proof-pattern",
        help=(
            "Glob selecting existing proofs, for example 'holt_s4-*.txt'. "
            "Default: inferred from a PDF named '*chapter_4.pdf'."
        ),
    )
    parser.add_argument(
        "--skip-errors",
        action="store_true",
        help="Report per-proof coordinate/checker failures and continue.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    pdf_path = args.pdf.expanduser().resolve()
    config = load_config(CONFIG_PATH)
    output_dir = (
        args.output_dir.expanduser().resolve()
        if args.output_dir
        else (PROJECT_ROOT / config["intermediate_run_output_dir"]).resolve()
    )
    run_dir = output_dir / pdf_path.stem

    if args.existing_proofs_dir:
        proofs_dir = args.existing_proofs_dir.expanduser().resolve()
        pattern = args.proof_pattern or find_proof_pattern(pdf_path)
        page_images = render_pdf_pages(
            pdf_path, run_dir / "pages", dpi=int(config["render_dpi"])
        )
        items = load_existing_proofs(proofs_dir, pattern)
    else:
        proofs_dir = PROJECT_ROOT / config["final_proof_output_dir"]
        page_images, items = extract_ender_from_pdf(
            pdf_path, config, run_dir / "pages", run_dir / "raw"
        )

    crops = extract_and_crop_diagrams(
        page_images, items, PROJECT_ROOT / config["cropped_diagram_output_dir"], config
    )[0]
    final_paths = finalize_and_save_proofs(
        items,
        crops,
        PROJECT_ROOT / config["coordinate_extraction_code_dir"],
        proofs_dir,
        skip_errors=args.skip_errors,
    )
    print("\n".join(str(path) for path in final_paths))


if __name__ == "__main__":
    main()
