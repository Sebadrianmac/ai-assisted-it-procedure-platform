from ai.prompts import build_procedure_steps_prompt
from ai.services import generate_ai_text
from ai.validators import validate_procedure_steps
import json

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
    instructions=instructions.strip()

    prompt = build_procedure_steps_prompt(
        title=title,
        description=description,
        instructions=instructions,
        )
    
    raw_answer = generate_ai_text(
        prompt,
        response_format={
            "type": "json_object",
        }
    )
    try:
        procedure_data = json.loads(raw_answer)
        
    except json.JSONDecodeError as error:
        raise ValueError(
            "AI returned invalid JSON."
        ) from error

    validated_procedure = validate_procedure_steps(
        procedure_data=procedure_data,
    )

    return {
        "procedure": validated_procedure,
    }   