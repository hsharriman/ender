from __future__ import annotations

from typing import Any
from litellm import completion


def call_completion(
    *,
    config: dict[str, Any],
    messages: list[dict[str, Any]],
    model_key: str,
) -> str:
    model = config[model_key]
    response = completion(model=model, messages=messages)
    print(f"LLM cost: {response._hidden_params.get('response_cost')}")
    return response.choices[0].message.content.strip()
