## Prompts - Contains instructions for various AI tasks:
from textwrap import dedent


def build_procedure_steps_prompt(
    title,
    description,
    instructions="",
):
    return dedent(
        f"""
        TASK:
        Generate IT procedure steps from the user's
        natural language request.

        OUTPUT FORMAT:
        Return one JSON object with this structure:
        {{
          "steps": [
            {{
              "step_number": 1,
              "description": "Action to perform"
            }}
          ]
        }}

        RULES:
        - Return valid JSON only.
        - Do not use Markdown.
        - Create between 3 and 10 steps.
        - Start step numbers at 1.
        - Keep step numbers sequential.
        - Every step must describe one clear action.
        - Do not invent company-specific policies or requirements.
        - Answer in English.

        PROCEDURE TITLE:
        {title.strip()}

        PROCEDURE DESCRIPTION:
        {description.strip()}
        
        ADDITIONAL INSTRUCTIONS:
        {instructions.strip()}
        """
    ).strip()
    
def build_procedure_from_examples_prompt(
    title,
    description,
    instructions,
    amountSteps,
    procedure_context,
    feedback_context,
):
    title_instruction = (
        title.strip()
        if title and title.strip()
        else "Generate an appropriate procedure title."
    )

    description_instruction = (
        description.strip()
        if description and description.strip()
        else "Generate a short procedure description."
    )

    steps_instruction = (
        f"Create exactly {amountSteps} steps."
        if amountSteps is not None
        else "Create between 3 and 10 steps."
    )

    return dedent(
        f"""
        Create a new IT procedure based on the user's request.

        USER INPUT:
        Title preference: {title}
        Description preference: {description}
        Requested number of steps: {amountSteps}
        Instructions: {instructions}

        APPROVED PROCEDURE EXAMPLES:
        {procedure_context or "No approved procedure examples were found."}

        USER FEEDBACK EXAMPLES:
        {feedback_context or "No relevant user feedback examples were found."}

        HOW TO USE THE CONTEXT:
        - Approved procedures are the primary source of organizational knowledge.
        - User feedback examples show preferred structure, wording, and corrections.
        - For modified feedback, prefer the user-corrected result over the original AI result.
        - Do not copy an example word for word.
        - Create a new procedure that matches the current user request.
        - Do not mention the examples or feedback in the response.

        OUTPUT FORMAT:
        Return one valid JSON object:
        {{
            "title": "Procedure title",
            "description": "Procedure description",
            "steps": [
                {{
                    "step_number": 1,
                    "description": "Action to perform"
                }}
            ]
        }}

        RULES:
        - Return valid JSON only.
        - Do not use Markdown.
        - Return between 3 and 10 steps.
        - Follow the requested number of steps when it is provided.
        - Step numbers must start at 1 and be sequential.
        - Every step must contain a clear description.
        - Answer in English.
        """.strip())
    
def build_role_recommendation_prompt(
    steps_text,
    available_roles,
):
    return f"""
    TASK:
    Recommend one responsible role for each procedure step.
    
    OUTPUT FORMAT:
        Return one JSON object with this structure:
        {{
            "recommendations": [
            {{
                "step_number": 1,
                "role_id": 1,
                "reason": "Short explanation"
            }}
            ]
        }}
    RULES:
    - Return valid JSON only.
    - Do not use Markdown.
    - Return exactly one recommendation for each provided step.
    - Use only the provided step numbers.
    - Use only the provided role IDs
    - For each step choose one role
    - Do not invent new roles; 
    - Answer in English
    PROCEDURE STEPS:
    {steps_text}

    AVAILABLE ROLES:
    {available_roles}
    """.strip()