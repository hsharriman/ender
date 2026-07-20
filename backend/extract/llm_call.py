from __future__ import annotations

import os
from typing import Any
from litellm import completion


def call_completion(
    *,
    config: dict[str, Any],
    messages: list[dict[str, Any]],
    model_key: str,
) -> str:
    model = config[model_key]
    kwargs: dict[str, Any] = {"model": model, "messages": messages}
    if os.getenv("OPENAI_API_BASE"):
        kwargs["api_base"] = os.getenv("OPENAI_API_BASE")
    if os.getenv("OPENAI_API_KEY"):
        kwargs["api_key"] = os.getenv("OPENAI_API_KEY")
    response = completion(**kwargs)
    print(f"LLM cost: {response._hidden_params.get('response_cost')}")
    return response.choices[0].message.content.strip()
