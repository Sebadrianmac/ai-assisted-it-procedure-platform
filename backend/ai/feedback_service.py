from ai.models import AIRecommendation
from django.utils import timezone

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


def update_procedure_ai_feedback(procedure_version):
    ai_recommendation = (
        AIRecommendation.objects.filter(
            procedure_version=procedure_version,
            recommendation_type=AIRecommendation.RecommendationType.PROCEDURE,
            feedback_status__in=[
            AIRecommendation.FeedbackStatus.PENDING,
            AIRecommendation.FeedbackStatus.ACCEPTED,
            AIRecommendation.FeedbackStatus.MODIFIED,
            AIRecommendation.FeedbackStatus.ABANDONED,
            ],
        )
        .first()
    )

    if ai_recommendation is None:
        return None

    original_output = ai_recommendation.ai_output.get("procedure")
    if not isinstance(original_output, dict):
        raise ValueError("AI recommendation does not contain a valid procedure output.")

    normalized_original_output = normalize_procedure_output(original_output)
    final_output = {
        "title": procedure_version.title.strip(),
        "description": procedure_version.description.strip(),
        "steps": [
            {
                "step_number": step.step_number,
                "description": step.description.strip(),
                "document_ids": sorted(
                    document.id 
                    for document in step.documents.all()
                    ),
            }
            for step in procedure_version.steps.order_by("step_number")
        ],
    }

    if normalized_original_output == final_output:
        feedback_status = AIRecommendation.FeedbackStatus.ACCEPTED
    else:
        feedback_status = AIRecommendation.FeedbackStatus.MODIFIED

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
    return ai_recommendation