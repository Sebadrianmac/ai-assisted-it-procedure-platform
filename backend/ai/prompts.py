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
    context,
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
        TASK:
        Create a complete IT procedure using the
        user's request and previous procedures as examples.

        OUTPUT FORMAT:
        Return one JSON object with this structure:
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
        - {steps_instruction}
        - Start step numbers at 1.
        - Keep step numbers sequential.
        - Every step must describe one clear action.
        - Use previous procedures only as examples.
        - Do not copy irrelevant steps.
        - Do not invent company-specific policies.
        - Answer in English.

        PREFERRED TITLE:
        {title_instruction}

        PREFERRED DESCRIPTION:
        {description_instruction}

        USER REQUEST:
        {instructions.strip()}

        PREVIOUS PROCEDURE EXAMPLES:
        {context}
        """
    ).strip()
    
def build_role_recommendation_prompt(
    step_description,
    available_roles,
):
    return f"""
    Recommend one responsible role...
    Step:
    {step_description}

    Available roles:
    {available_roles}
    """.strip()