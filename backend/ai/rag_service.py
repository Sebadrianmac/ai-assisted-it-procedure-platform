# RAG service - tasks which require a search through documents
from ai.search_service import (
    search_similar_procedures,
    search_relevant_documents,
    search_similar_ai_feedback,
)
from ai.services import generate_ai_text
from ai.prompts import build_procedure_from_examples_prompt
from ai.validators import validate_created_procedure
import json

from ai.models import AIRecommendation

PROCEDURE_EXAMPLE_LIMIT = 3
AI_FEEDBACK_EXAMPLE_LIMIT = 3


def build_ai_feedback_context(
    search_results,
):
    context_parts = []
    seen_recommendation_ids = set()

    for item in search_results:
        recommendation = item.source.ai_recommendation

        if recommendation.id in seen_recommendation_ids:
            continue

        seen_recommendation_ids.add(recommendation.id)
        original_output = recommendation.ai_output

        if isinstance(original_output, dict):
            original_output = original_output.get(
                "procedure", original_output
            )

        final_output = recommendation.final_output

        example_number = len(context_parts) + 1

        if recommendation.feedback_status == AIRecommendation.FeedbackStatus.MODIFIED:
            context_parts.append(
                (
                    f"[User Feedback Example {example_number}]\n"
                    "Feedback: modified\n"
                    "User request:\n"
                    f"{json.dumps(recommendation.input_data, ensure_ascii=False)}\n"
                    "Original AI result:\n"
                    f"{json.dumps(original_output, ensure_ascii=False)}\n"
                    "User-corrected result:\n"
                    f"{json.dumps(final_output, ensure_ascii=False)}"
                )
            )
        else:
            context_parts.append(
                (
                    f"[User Feedback Example {example_number}]\n"
                    "Feedback: accepted\n"
                    "User request:\n"
                    f"{json.dumps(recommendation.input_data, ensure_ascii=False)}\n"
                    "Accepted result:\n"
                    f"{json.dumps(final_output, ensure_ascii=False)}"
                )
            )

    return "\n\n".join(context_parts)


def build_procedure_examples_context(
    search_results,
):
    context_parts = []
    seen_version_ids = set()

    for item in search_results:
        version = item.source.procedure_version

        if version.id in seen_version_ids:
            continue

        seen_version_ids.add(version.id)

        example_number = len(context_parts) + 1

        context_parts.append(
            (
                f"[Example Procedure {example_number}]\n"
                f"{item.content}"
            )
        )

    return "\n\n".join(context_parts)


def generate_procedure_from_examples(
    title,
    description,
    instructions,
    amountSteps=None,
):
    procedures = search_similar_procedures(
        title=title,
        description=description,
        instructions=instructions,
        limit=PROCEDURE_EXAMPLE_LIMIT,
    )

    feedback_results = search_similar_ai_feedback(
        title=title,
        description=description,
        instructions=instructions,
        limit=AI_FEEDBACK_EXAMPLE_LIMIT,
    )

    procedure_context = build_procedure_examples_context(procedures)
    feedback_context = build_ai_feedback_context(feedback_results)

    prompt = build_procedure_from_examples_prompt(
        title=title,
        description=description,
        instructions=instructions,
        amountSteps=amountSteps,
        procedure_context=procedure_context,
        feedback_context=feedback_context,
    )
    raw_answer = generate_ai_text(
        prompt=prompt,
        response_format={
            "type": "json_object",
        }
    )
    try:
        procedure_data = json.loads(raw_answer)
    except json.JSONDecodeError as error:
        raise ValueError("AI returned invalid JSON") from error

    validated_procedure = validate_created_procedure(
        procedure=procedure_data,
        amountSteps=amountSteps,
    )
    for step in validated_procedure["steps"]:
        recommendations = search_relevant_documents(
            text=step["description"],
            limit=3,
        )

        step["document_ids"] = [
            recommendation["document"].id
            for recommendation in recommendations
        ]

        step["recommended_documents"] = [
            {
                "id": recommendation["document"].id,
                "title": recommendation["document"].title,
                "similarity": recommendation["similarity"],
            }
            for recommendation in recommendations
        ]
    return {
        "procedure": validated_procedure,
    }