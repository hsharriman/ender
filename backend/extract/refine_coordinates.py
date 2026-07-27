import base64
import sys
from pathlib import Path
from dotenv import load_dotenv
from litellm import completion


proof_path = Path(sys.argv[1])
image_path = Path(sys.argv[2])
metadata_path = Path(sys.argv[3])
load_dotenv(Path(__file__).parent / "keys" / ".env", override=False)

prompt_path = Path(__file__).parent / "prompts" / "refine_coordinates.txt"
prompt = prompt_path.read_text(encoding="utf-8")
prompt = prompt.replace("{proof_text}", proof_path.read_text(encoding="utf-8"))
prompt = prompt.replace("{metadata_json}", metadata_path.read_text(encoding="utf-8"))
image = base64.b64encode(image_path.read_bytes()).decode("ascii")

response = completion(
    model="gpt-5.5",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{image}",
                        "detail": "high",
                    },
                },
            ],
        }
    ],
)
print(response.choices[0].message.content.strip())
