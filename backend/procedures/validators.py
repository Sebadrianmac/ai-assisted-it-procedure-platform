from rest_framework import status
from rest_framework.response import Response


def validate_procedure_content(
    request_data,
):
    title = request_data.get(
        "title",
        "",
    )

    description = request_data.get(
        "description",
        "",
    )

    steps = request_data.get(
        "steps",
        [],
    )

    if not isinstance(title, str):
        return None, Response(
            {
                "title": (
                    "Title must be a string."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    title = title.strip()

    if not title:
        return None, Response(
            {
                "title": "Title is required.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not isinstance(description, str):
        return None, Response(
            {
                "description": (
                    "Description must be a string."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    description = description.strip()

    if not isinstance(steps, list):
        return None, Response(
            {
                "steps": "Steps must be a list.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    validated_steps = []

    for index, step_data in enumerate(
        steps,
        start=1,
    ):
        if not isinstance(step_data, dict):
            return None, Response(
                {
                    "steps": (
                        f"Step {index} must "
                        "be an object."
                    ),
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        step_description = step_data.get(
            "description",
            "",
        )

        if not isinstance(
            step_description,
            str,
        ):
            return None, Response(
                {
                    "steps": (
                        f"Step {index} description "
                        "must be a string."
                    ),
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        step_description = (
            step_description.strip()
        )

        if not step_description:
            return None, Response(
                {
                    "steps": (
                        f"Step {index} cannot "
                        "be empty."
                    ),
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        validated_steps.append({
            "step_number": index,
            "description": step_description,
        })

    return {
        "title": title,
        "description": description,
        "steps": validated_steps,
    }, None