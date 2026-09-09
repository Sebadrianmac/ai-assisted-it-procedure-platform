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