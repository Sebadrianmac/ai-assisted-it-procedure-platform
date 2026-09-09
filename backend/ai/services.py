# Services.py - responsible for communication with llama-server
import requests
from django.conf import settings


def generate_ai_text(
    prompt,
    response_format=None,
):
    request_data = {
        "model": settings.LOCAL_AI_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You create clear IT procedures. "
                    "Answer in English."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        "chat_template_kwargs": {
            "enable_thinking": False,
        },
        "max_tokens": 800,
        "stream": False,
    }

    if response_format is not None:
        request_data["response_format"] = response_format

    response = requests.post(
        (
            f"{settings.LOCAL_AI_BASE_URL.rstrip('/')}"
            "/v1/chat/completions"
        ),
        json=request_data,
        timeout=(10, 120),
    )

    response.raise_for_status()

    data = response.json()

    return data["choices"][0]["message"]["content"]