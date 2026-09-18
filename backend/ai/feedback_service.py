from ai.models import AIRecommendation
from django.utils import timezone
from django.db import transaction

from ai.embedding_service import (
    index_ai_feedback,
)


def update_ai_feedback_for_version(procedure_version):
    recommendations = (
        AIRecommendation.objects
        .filter(
            procedure_version=procedure_version,
            feedback_status__in=[
                AIRecommendation.FeedbackStatus.PENDING,
                AIRecommendation.FeedbackStatus.ACCEPTED,
                AIRecommendation.FeedbackStatus.MODIFIED,
            ],
        )
        .order_by("id")
    )
    for recommendation in recommendations:
        if (
            recommendation.recommendation_type
            == AIRecommendation.RecommendationType.PROCEDURE
        ):
            update_procedure_ai_feedback(
                recommendation,
                procedure_version,
            )

        elif (
            recommendation.recommendation_type
            == AIRecommendation.RecommendationType.PROCEDURE_STEP
        ):
            update_steps_ai_feedback(
                recommendation,
                procedure_version,
            )

def normalize_procedure_output(procedure_data):
    return {
        "title": procedure_data.get("title", "").strip(),
        "description": procedure_data.get("description", "").strip(),
        "steps": [
            {
                "step_number": step["step_number"],
                "description": step["description"].strip(),
                "document_ids": sorted(set(step.get("document_ids", []))),
            }
            for step in procedure_data.get("steps", [])
        ],
    }


def update_procedure_ai_feedback(ai_recommendation, procedure_version):

    if ai_recommendation.procedure_version_id != procedure_version.id:
        raise ValueError(
            "AI recommendation is not linked "
            "to this procedure version."
        )

    original_output = ai_recommendation.ai_output.get("procedure")
    if not isinstance(original_output, dict):
        raise ValueError(
            "AI recommendation does not contain a valid procedure output."
        )

    normalized_original_output = normalize_procedure_output(original_output)
    final_output = {
        "title": procedure_version.title.strip(),
        "description": procedure_version.description.strip(),
        "steps": [
            {
                "step_number": step.step_number,
                "description": step.description.strip(),
                "document_ids": sorted(
                    document.id for document in step.documents.all()
                ),
            }
            for step in procedure_version.steps.order_by("step_number")
        ],
    }

    if normalized_original_output == final_output:
        feedback_status = AIRecommendation.FeedbackStatus.ACCEPTED
    else:
        feedback_status = AIRecommendation.FeedbackStatus.MODIFIED
    should_reindex = (
        ai_recommendation.feedback_status
        != feedback_status
        or ai_recommendation.final_output
        != final_output
    )
    ai_recommendation.final_output = final_output
    ai_recommendation.feedback_status = feedback_status
    ai_recommendation.evaluated_at = timezone.now()

    ai_recommendation.save(
        update_fields=[
            "final_output",
            "feedback_status",
            "evaluated_at",
            "updated_at",
        ]
    )
    if should_reindex:
        transaction.on_commit(
            lambda: index_ai_feedback(ai_recommendation),
            robust=True,
        )
    return ai_recommendation


def update_steps_ai_feedback(ai_recommendation, procedure_version):
    if ai_recommendation.procedure_version_id != procedure_version.id:
        raise ValueError(
            "AI recommendation is not linked "
            "to this procedure version."
        )
    original_output = ai_recommendation.ai_output.get("procedure")
    if not isinstance(original_output, dict):
        raise ValueError(
            "AI recommendation does not "
            "contain a valid output."
        )

    original_steps = original_output.get("steps")

    if not isinstance(original_steps, list):
        raise ValueError(
            "AI recommendation does not "
            "contain a valid steps list."
        )
    final_steps = [
        {
            "step_number": step.step_number,
            "description": step.description.strip(),
        }
        for step in procedure_version.steps.order_by("step_number")
    ]
    if original_steps == final_steps:
        feedback_status = AIRecommendation.FeedbackStatus.ACCEPTED
    else:
        feedback_status = AIRecommendation.FeedbackStatus.MODIFIED
    should_reindex = (
        ai_recommendation.feedback_status
        != feedback_status
        or ai_recommendation.final_output
        != final_steps
    )
    ai_recommendation.final_output = {"steps": final_steps}
    ai_recommendation.feedback_status = feedback_status
    ai_recommendation.evaluated_at = timezone.now()

    ai_recommendation.save(
        update_fields=[
            "final_output",
            "feedback_status",
            "evaluated_at",
            "updated_at",
        ]
    )

    if should_reindex:
        transaction.on_commit(
            lambda recommendation=(
                ai_recommendation
            ): index_ai_feedback(
                recommendation
            ),
            robust=True,
        )

    return ai_recommendation