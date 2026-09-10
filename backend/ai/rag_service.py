#RAG service - tasks which requires a search through documents
from ai.search_service import search_similar_procedures
from ai.services import generate_ai_text
from ai.prompts import build_procedure_from_examples_prompt
from ai.validators import validate_created_procedure
import json;

PROCEDURE_EXAMPLE_LIMIT = 3
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
        limit=PROCEDURE_EXAMPLE_LIMIT
    )
    
    context = build_procedure_examples_context(procedures)
    prompt = build_procedure_from_examples_prompt(
        title=title,
        description=description,
        instructions=instructions,
        amountSteps=amountSteps,
        context=context
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
        raise ValueError(
            "Ai returned invalid JSON"
        ) from error
    
    validated_procedure = validate_created_procedure(
        procedure=procedure_data,
        amountSteps=amountSteps,
    )   
    return {
        "procedure":validated_procedure
    }