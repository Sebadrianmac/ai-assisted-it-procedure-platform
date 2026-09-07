import requests

from django.conf import settings


def generate_ai_text(prompt):
    response = requests.post(
        (
            f"{settings.LOCAL_AI_BASE_URL.rstrip('/')}"
            "/v1/chat/completions"
        ),
        json={
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
        },
        timeout=(10, 120),
    )

    response.raise_for_status()

    data = response.json()

    return data["choices"][0]["message"]["content"]