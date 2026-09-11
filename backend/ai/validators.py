# Validate procedure steps received from the LLM.
def validate_procedure_steps(procedure_data):
    if not isinstance(procedure_data, dict):
        raise ValueError(
            "AI response must be a JSON object."
        )

    steps = procedure_data.get("steps")

    if not isinstance(steps, list):
        raise ValueError(
            "AI response must contain a steps list."
        )

    if not 3 <= len(steps) <= 10:
        raise ValueError(
            "AI response must contain between 3 and 10 steps."
        )

    validated_steps = []

    for expected_number, step in enumerate(
        steps,
        start=1,
    ):
        if not isinstance(step, dict):
            raise ValueError(
                f"Step {expected_number} must be an object."
            )

        step_number = step.get("step_number")
        description = step.get("description")

        if (
            not isinstance(step_number, int)
            or isinstance(step_number, bool)
            or step_number != expected_number
        ):
            raise ValueError(
                "AI returned invalid step numbering."
            )

        if (
            not isinstance(description, str)
            or not description.strip()
        ):
            raise ValueError(
                (
                    f"Step {expected_number} must "
                    "contain a description."
                )
            )

        validated_steps.append(
            {
                "step_number": expected_number,
                "description": description.strip(),
            }
        )

    return {
        "steps": validated_steps,
    }
    
def validate_created_procedure(
    procedure,
    amountSteps=None,
):
    if not isinstance(procedure, dict):
        raise ValueError(
            "AI response must be a JSON object."
        )

    title = procedure.get("title")
    if (
        not isinstance(title, str)
        or not title.strip()
    ):
        raise ValueError(
            "AI response must contain a title string."
        )

    procedure_description = procedure.get(
        "description"
    )
    if (
        not isinstance(procedure_description, str)
        or not procedure_description.strip()
    ):
        raise ValueError(
            (
                "AI response must contain "
                "a description string."
            )
        )

    steps = procedure.get("steps")
    if not isinstance(steps, list):
        raise ValueError(
            "AI response must contain a steps list."
        )

    if not 3 <= len(steps) <= 10:
        raise ValueError(
            (
                "AI response must contain "
                "between 3 and 10 steps."
            )
        )

    if (
        amountSteps is not None
        and len(steps) != amountSteps
    ):
        raise ValueError(
            (
                f"AI response must contain exactly "
                f"{amountSteps} steps."
            )
        )

    validated_steps = []
    for expected_number, step in enumerate(
        steps,
        start=1,
    ):
        if not isinstance(step, dict):
            raise ValueError(
                f"Step {expected_number} must be an object."
            )

        step_number = step.get("step_number")
        step_description = step.get("description")

        if (
            not isinstance(step_number, int)
            or isinstance(step_number, bool)
            or step_number != expected_number
        ):
            raise ValueError(
                "AI returned invalid step numbering."
            )

        if (
            not isinstance(step_description, str)
            or not step_description.strip()
        ):
            raise ValueError(
                (
                    f"Step {expected_number} must "
                    "contain a description."
                )
            )

        validated_steps.append(
            {
                "step_number": expected_number,
                "description": (
                    step_description.strip()
                ),
            }
        )

    return {
        "title": title.strip(),
        "description": (
            procedure_description.strip()
        ),
        "steps": validated_steps,
    }
def validate_role_recommendations(
    response_data,
    allowed_step_numbers,
    allowed_role_ids,
):
    if not isinstance(response_data, dict):
        raise ValueError(
            "AI response must be a JSON object."
        )

    recommendations = response_data.get(
        "recommendations"
    )

    if not isinstance(recommendations, list):
        raise ValueError(
            "AI response must contain "
            "a recommendations list."
        )

    if (
        len(recommendations)
        != len(allowed_step_numbers)
    ):
        raise ValueError(
            "AI must return one recommendation "
            "for every provided step."
        )

    validated_recommendations = []
    received_step_numbers = set()

    for recommendation in recommendations:
        if not isinstance(recommendation, dict):
            raise ValueError(
                "Every recommendation must be an object."
            )

        step_number = recommendation.get(
            "step_number"
        )
        role_id = recommendation.get("role_id")
        reason = recommendation.get("reason")

        if (
            not isinstance(step_number, int)
            or isinstance(step_number, bool)
            or step_number not in allowed_step_numbers
        ):
            raise ValueError(
                "AI returned an invalid step number."
            )

        if step_number in received_step_numbers:
            raise ValueError(
                "AI returned multiple recommendations "
                f"for step {step_number}."
            )

        if (
            not isinstance(role_id, int)
            or isinstance(role_id, bool)
            or role_id not in allowed_role_ids
        ):
            raise ValueError(
                f"AI returned an invalid role ID "
                f"for step {step_number}."
            )

        if (
            not isinstance(reason, str)
            or not reason.strip()
        ):
            raise ValueError(
                f"Recommendation for step "
                f"{step_number} must contain a reason."
            )

        received_step_numbers.add(
            step_number
        )

        validated_recommendations.append(
            {
                "step_number": step_number,
                "role_id": role_id,
                "reason": reason.strip(),
            }
        )

    missing_step_numbers = (
        allowed_step_numbers
        - received_step_numbers
    )

    if missing_step_numbers:
        raise ValueError(
            "AI did not return recommendations "
            "for every provided step."
        )

    return validated_recommendations