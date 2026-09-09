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