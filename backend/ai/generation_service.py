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
from ai.search_service import search_similar_steps_feedback
from ai.models import AIRecommendation
def build_steps_feedback_context(
    search_results,
):
    context_parts = []
    seen_recommendation_ids = set()

    for item in search_results:
        recommendation = (
            item.source.ai_recommendation
        )

        if (
            recommendation.id
            in seen_recommendation_ids
        ):
            continue

        seen_recommendation_ids.add(
            recommendation.id
        )

        ai_output = recommendation.ai_output
        final_output = (
            recommendation.final_output
        )

        if (
            not isinstance(ai_output, dict)
            or not isinstance(
                final_output,
                dict,
            )
        ):
            continue

        procedure_output = ai_output.get(
            "procedure",
            {},
        )

        original_steps = (
            procedure_output.get(
                "steps",
                [],
            )
            if isinstance(
                procedure_output,
                dict,
            )
            else []
        )

        final_steps = final_output.get(
            "steps",
            [],
        )

        example_number = (
            len(context_parts) + 1
        )

        if (
            recommendation.feedback_status
            == AIRecommendation
            .FeedbackStatus
            .MODIFIED
        ):
            context_parts.append(
                (
                    f"[Step Feedback Example "
                    f"{example_number}]\n"
                    "Feedback: modified\n"
                    "Original AI steps:\n"
                    f"{json.dumps(
                        original_steps,
                        ensure_ascii=False,
                    )}\n"
                    "User-corrected steps:\n"
                    f"{json.dumps(
                        final_steps,
                        ensure_ascii=False,
                    )}"
                )
            )
        else:
            context_parts.append(
                (
                    f"[Step Feedback Example "
                    f"{example_number}]\n"
                    "Feedback: accepted\n"
                    "Accepted steps:\n"
                    f"{json.dumps(
                        final_steps,
                        ensure_ascii=False,
                    )}"
                )
            )

    return "\n\n".join(context_parts)


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

    feedback_results = list(
        search_similar_steps_feedback(
            title=title,
            description=description,
            instructions=instructions,
            limit=2,
        )
    )

    feedback_context = (
        build_steps_feedback_context(
            feedback_results
        )
    )
    prompt = build_procedure_steps_prompt(
        title=title,
        description=description,
        instructions=instructions,
        feedback_context=feedback_context,
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
