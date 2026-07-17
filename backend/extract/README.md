# ENDER Textbook Proof Extraction Pipeline

This package converts one or more geometry proofs in a textbook PDF into ENDER
proof files. The full pipeline:

1. renders every PDF page as an image;
2. asks a multimodal LLM to extract proofs in ENDER syntax;
3. asks the LLM to locate and crop the diagram for each proof;
4. extracts labeled point coordinates from each cropped diagram; and
5. replaces the generated `pt:` declaration and saves the final proof files.

## Required repository layout

The paths below are relative to the `ender` repository root:

```text
ender/
|-- backend/
|   |-- requirements.txt
|   `-- extract/
|       |-- configs/config.json
|       |-- keys/.env                 # create this file locally
|       |-- prompts/
|       |-- sample/pdf.pdf
|       `-- pipeline.py
|-- geo-proof-dataset/
|   |-- coordinate_extraction/
|   |   |-- prompts/prompt.txt
|   |   |-- run_coordinate_extraction.py
|   |   `-- requirements.txt
|   `-- proofs/                       # prompt examples referenced by config
`-- src/checker/grammar/defs/          # ENDER statement/reason definitions
```

## Installation

Run all commands in this README from the `ender` directory.

### Windows PowerShell

```powershell
cd path\to\ender
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
python -m pip install -r geo-proof-dataset/coordinate_extraction/requirements.txt
npm install
```

### macOS or Linux

```bash
cd path/to/ender
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
python -m pip install -r geo-proof-dataset/coordinate_extraction/requirements.txt
npm install
```

The coordinate extractor installs OpenCV, NumPy, and Matplotlib separately
from the main extraction dependencies. Both requirements files are necessary
for the full pipeline. Node.js, npm, and the repository's npm dependencies are
also required because each final proof is checked with the ENDER checker.

## API credentials

> **Model support:** currently works with OpenAI models and OpenAI-compatible API endpoints

Create this file:

```text
backend/extract/keys/.env
```

Add the following variables:

```env
OPENAI_API_BASE=https://your-compatible-endpoint/v1
OPENAI_API_KEY=your-api-key
```

## Configuration

Edit `backend/extract/configs/config.json` before running the pipeline.

| Setting | Purpose |
| --- | --- |
| `pdf_to_ender_model` | Multimodal model that extracts ENDER proof text. |
| `diagram_locator_model` | Multimodal model that finds each proof diagram. |
| `diagram_crop_refinement_model` | Multimodal model that refines each crop. |
| `crop_padding_ratio` | Extra padding around the refined diagram crop. |
| `render_dpi` | Resolution used to render PDF pages. Higher values use more memory and request data. |
| `env_path` | Credential file, relative to the `ender` root. |
| `prompt_path` | Proof-extraction prompt, relative to the `ender` root. |
| `crop_prompt_path` | Diagram-location prompt, relative to the `ender` root. |
| `crop_refinement_prompt_path` | Crop-refinement prompt, relative to the `ender` root. |
| `stmts_defs` / `reasons_defs` | ENDER grammar definitions included in the extraction prompt. |
| `example_files` | Existing ENDER proofs included as few-shot examples. Missing examples are silently skipped. |
| `coordinate_extraction_code_dir` | Coordinate extractor directory. |
| `final_proof_output_dir` | Destination for final `.txt` proof files. |
| `cropped_diagram_output_dir` | Destination for cropped diagrams and coordinate metadata. |
| `intermediate_run_output_dir` | Destination for rendered pages and raw proof files. |
| `max_pdf_text_chars` | Maximum embedded PDF text added to the LLM request. |

All paths in `config.json` are resolved from the `ender` repository root.

The pipeline creates these output directories when needed.

## Run the full pipeline

From the `ender` directory, run the included PDF sample:

```powershell
python -m backend.extract.pipeline backend/extract/sample/pdf.pdf
```

Run a different PDF:

```powershell
python -m backend.extract.pipeline "\path\to\textbook-pages.pdf"
```

On macOS or Linux:

```bash
python -m backend.extract.pipeline /path/to/textbook-pages.pdf
```

The optional second argument overrides only the intermediate output directory
for that run (mainly for testing):

```powershell
python -m backend.extract.pipeline backend/extract/sample/pdf.pdf .\pipeline_runs
```

The final proof and cropped-diagram destinations still come from `config.json`.
Relative paths passed as command-line arguments are resolved from the current
working directory.

## Outputs

For an input named `chapter4.pdf`, the default layout is:

```text
pipeline_test_output_raw/
`-- chapter4/
    |-- pages/
    |   |-- page_0001.png
    |   `-- ...
    `-- raw/
        |-- extracted-proof-1.txt
        `-- ...

ender/geo-proof-dataset/
|-- test_diagrams/
|   |-- extracted-proof-1_diagram.png
|   |-- extracted-proof-1_diagram_metadata.json
|   `-- ...
`-- test_proofs/
    |-- extracted-proof-1.txt
    `-- ...
```

The command prints the absolute path of every final proof file after a
successful run. If the LLM marks an item as not extractable, no final proof is
created for that item. If an extractable proof has no diagram, coordinate
extraction misses a required point, or the final proof fails the ENDER checker,
the pipeline stops with a descriptive error.
