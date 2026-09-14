import json
from ai.prompts import (
    build_procedure_steps_prompt,
    build_role_recommendation_prompt,
)
from ai.services import generate_ai_text
from ai.validators import (
    validate_procedure_steps,
    validate_role_recommendations,
)
from django.contrib.auth.models import Group


def generate_steps_from_input(title, description, instructions=""):
    if not isinstance(title, str):
        raise ValueError("Title must be text.")
    title = title.strip()
    if not title:
        raise ValueError("Title cannot be empty..")

    if not isinstance(description, str):
        raise ValueError("Description must be text.")
    description = description.strip()
    if not description:
        raise ValueError("description cannot be empty.")

    if not isinstance(instructions, str):
        raise ValueError("Instructions must be text.")
    instructions = instructions.strip()

    prompt = build_procedure_steps_prompt(
        title=title,
        description=description,
        instructions=instructions,
    )

    raw_answer = generate_ai_text(
        prompt,
        response_format={
            "type": "json_object",
        },
    )
    try:
        procedure_data = json.loads(raw_answer)
    except json.JSONDecodeError as error:
        raise ValueError("AI returned invalid JSON.") from error

    validated_procedure = validate_procedure_steps(
        procedure_data=procedure_data,
    )

    return {
        "procedure": validated_procedure,
    }


def recommend_roles_for_steps(steps):
    if not isinstance(steps, list) or not steps:
        raise ValueError("Steps must be a non-empty list.")

    validated_input_steps = []

    for step in steps:
        if not isinstance(step, dict):
            raise ValueError("Every step must be an object.")

        step_number = step.get("step_number")
        description = step.get("description")

        if not isinstance(step_number, int) or isinstance(step_number, bool):
            raise ValueError("Every step must contain a valid step number.")

        if not isinstance(description, str) or not description.strip():
            raise ValueError(f"Step {step_number} must contain a description.")

        validated_input_steps.append(
            {
                "step_number": step_number,
                "description": description.strip(),
            }
        )

    roles = list(Group.objects.order_by("id"))

    if not roles:
        raise ValueError("No roles are available.")

    steps_text = "\n".join(
        f"{step['step_number']}. {step['description']}"
        for step in validated_input_steps
    )

    roles_text = "\n".join(
        f"{role.id}. {role.name}" 
        for role in roles
    )
    
    prompt = build_role_recommendation_prompt(
        steps_text=steps_text,
        available_roles=roles_text,
    )
    raw_answer = generate_ai_text(
        prompt=prompt,
        response_format={
            "type": "json_object",
        },
    )
    try:
        response_data = json.loads(raw_answer)
    except json.JSONDecodeError as error:
        raise ValueError("AI returned invalid JSON.") from error
    
    allowed_step_numbers = {
        step["step_number"] 
        for step in validated_input_steps
    }
    if (
        len(allowed_step_numbers)
        != len(validated_input_steps)
    ):
        raise ValueError(
            "Step numbers must be unique."
        )
    allowed_role_ids = {
        role.id 
        for role in roles
    }
    
    validated_recommendations = validate_role_recommendations(
        response_data=response_data,
        allowed_step_numbers=allowed_step_numbers,
        allowed_role_ids=allowed_role_ids,
    )
    role_names = {
        role.id: role.name 
        for role in roles
    }
    for recommendation in validated_recommendations:
        recommendation["role_name"] = role_names[recommendation["role_id"]]

    return validated_recommendations
