import torch
from transformers import (
    AutoConfig,
    AutoModel,
    AutoTokenizer,
)
from ai.models import AIRecommendation, KnowledgeBaseItem, KnowledgeSource, SourceType
from procedures.models import StatusChoices
from ai.document_text_service import extract_document_text
MODEL_NAME = "Snowflake/snowflake-arctic-embed-m-v2.0"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

model = None
tokenizer = None

def split_text_into_chunks( 
    text,
    tokenizer,
    chunk_size=400,
    overlap=50,
):
    token_ids = tokenizer.encode(
        text,
        add_special_tokens=False,
    )

    chunks = []
    step_size = chunk_size - overlap

    for start_index in range(0, len(token_ids), step_size):
        chunk_token_ids = token_ids[
            start_index:start_index + chunk_size
        ]

        chunk_text = tokenizer.decode(
            chunk_token_ids,
            skip_special_tokens=True,
        ).strip()

        if chunk_text:
            chunks.append(chunk_text)

        if start_index + chunk_size >= len(token_ids):
            break

    return chunks
def build_procedure_version_content(
    procedure_version,
):
    steps = procedure_version.steps.order_by(
        "step_number"
    )

    step_lines = []

    for step in steps:
        step_lines.append(
            f"{step.step_number}. "
            f"{step.description.strip()}"
        )

    steps_content = "\n".join(step_lines)

    content_parts = [
        f"Procedure: {procedure_version.title}",
    ]

    if procedure_version.description.strip():
        content_parts.append(
            "Description:\n"
            f"{procedure_version.description.strip()}"
        )

    if steps_content:
        content_parts.append(
            f"Steps:\n{steps_content}"
        )

    return "\n\n".join(content_parts)

def index_document(document):
    file_text = extract_document_text(document)

    content_parts = [
        document.title,
        document.description,
        file_text,
    ]

    content = "\n\n".join(
        part.strip() for part in content_parts if part and part.strip()
    )

    if not content:
        raise ValueError(
            "Document does not contain text."
        )

    source, _ = KnowledgeSource.objects.get_or_create(
        source_type=SourceType.DOCUMENT,
        document=document,
        defaults={"is_active": True},
    )

    _, tokenizer = load_embedding_model()
    chunks = split_text_into_chunks(
        content,
        tokenizer,
    )

    indexed_items = []
    for chunk_number, chunk_content in enumerate(chunks):
        embedding = generate_embedding(
            chunk_content,
        )

        knowledge_item, _ = KnowledgeBaseItem.objects.update_or_create(
            source=source,
            chunk_number=chunk_number,
            defaults={
                "content": chunk_content,
                "embedding": embedding,
            },
        )

        indexed_items.append(knowledge_item)

    KnowledgeBaseItem.objects.filter(
        source=source,
        chunk_number__gte=len(chunks),
    ).delete()

    return indexed_items

def index_ai_feedback(
    recommendation,
):
    content = build_ai_feedback_content(recommendation)

    source, _ = KnowledgeSource.objects.update_or_create(
        ai_recommendation=recommendation,
        defaults={
            "source_type": SourceType.AI_FEEDBACK,
            "document": None,
            "procedure_version": None,
            "is_active": True,
        },
    )

    _, tokenizer = load_embedding_model()
    chunks = split_text_into_chunks(content, tokenizer)

    indexed_items = []
    for chunk_number, chunk_content in enumerate(chunks):
        embedding = generate_embedding(chunk_content)

        knowledge_item, _ = KnowledgeBaseItem.objects.update_or_create(
            source=source,
            chunk_number=chunk_number,
            defaults={
                "content": chunk_content,
                "embedding": embedding,
            },
        )

        indexed_items.append(knowledge_item)

    KnowledgeBaseItem.objects.filter(
        source=source,
        chunk_number__gte=len(chunks),
    ).delete()

    return indexed_items

def index_procedure_version(
    procedure_version,
):
    if (
        procedure_version.status
        != StatusChoices.COMPLETED
        or not procedure_version.is_current
    ):
        raise ValueError(
            "Only the current approved procedure "
            "version can be indexed."
        )

    content = build_procedure_version_content(
        procedure_version
    )
    source, _ = KnowledgeSource.objects.update_or_create(
        procedure_version=procedure_version,
        defaults={
            "source_type": SourceType.PROCEDURE,
            "document": None,
            "is_active": True,
        },
    )
    KnowledgeSource.objects.filter(
        source_type=SourceType.PROCEDURE,
        procedure_version__procedure_id=(
            procedure_version.procedure_id
        ),
    ).exclude(
        id=source.id,
    ).update(
        is_active=False,
    )
   
    _, tokenizer = load_embedding_model()

    chunks = split_text_into_chunks(
        content,
        tokenizer,
    )

    indexed_items = []

    for chunk_number, chunk_content in enumerate(
        chunks
    ):
        embedding = generate_embedding(
            chunk_content
        )

        knowledge_item, _ = (
            KnowledgeBaseItem.objects.update_or_create(
                source=source,
                chunk_number=chunk_number,
                defaults={
                    "content": chunk_content,
                    "embedding": embedding,
                },
            )
        )

        indexed_items.append(
            knowledge_item
        )

    KnowledgeBaseItem.objects.filter(
        source=source,
        chunk_number__gte=len(chunks),
    ).delete()

    return indexed_items


def build_ai_feedback_content(
    recommendation,
):
    if (
        recommendation.feedback_status
        not in [
            AIRecommendation.FeedbackStatus.ACCEPTED,
            AIRecommendation.FeedbackStatus.MODIFIED,
        ]
    ):
        raise ValueError(
            "Only accepted or modified AI "
            "recommendations can be indexed."
        )

    if (
        recommendation.recommendation_type
        == AIRecommendation.RecommendationType.PROCEDURE_STEP
    ):
        return build_steps_feedback_content(
            recommendation
        )

    if (
        recommendation.recommendation_type
        != AIRecommendation.RecommendationType.PROCEDURE
    ):
        raise ValueError(
            "This AI recommendation type "
            "cannot currently be indexed."
        )


def build_procedure_feedback_content(recommendation):
    final_output = recommendation.final_output

    if not isinstance(final_output, dict):
        raise ValueError(
            "AI recommendation does not contain "
            "a valid final output."
        )

    input_data = recommendation.input_data

    if not isinstance(input_data, dict):
        raise ValueError(
            "AI recommendation does not contain "
            "valid input data."
        )

    content_parts = [
        "AI procedure feedback",
        (
            "Feedback status: "
            f"{recommendation.feedback_status}"
        ),
    ]

    instructions = input_data.get("instructions")

    if isinstance(instructions, str) and instructions.strip():
        content_parts.append(
            f"User request:\n{instructions.strip()}"
        )

    title = final_output.get("title")
    description = final_output.get("description")
    steps = final_output.get("steps", [])

    if isinstance(title, str) and title.strip():
        content_parts.append(
            f"Final title:\n{title.strip()}"
        )

    if (
        isinstance(description, str)
        and description.strip()
    ):
        content_parts.append(
            "Final description:\n"
            f"{description.strip()}"
        )

    if isinstance(steps, list):
        step_lines = []

        for step in steps:
            if not isinstance(step, dict):
                continue

            step_number = step.get("step_number")
            step_description = step.get(
                "description"
            )

            if (
                isinstance(step_number, int)
                and isinstance(
                    step_description,
                    str,
                )
                and step_description.strip()
            ):
                step_lines.append(
                    f"{step_number}. "
                    f"{step_description.strip()}"
                )

        if step_lines:
            content_parts.append(
                "Final steps:\n"
                + "\n".join(step_lines)
            )

    return "\n\n".join(content_parts)


def build_steps_feedback_content(
    recommendation,
):
    input_data = recommendation.input_data
    final_output = (
        recommendation.final_output
    )

    if not isinstance(input_data, dict):
        raise ValueError(
            "AI recommendation does not "
            "contain valid input data."
        )

    if not isinstance(final_output, dict):
        raise ValueError(
            "AI recommendation does not "
            "contain valid final output."
        )

    steps = final_output.get("steps")

    if not isinstance(steps, list):
        raise ValueError(
            "AI recommendation does not "
            "contain a valid steps list."
        )

    content_parts = [
        "AI procedure steps feedback",
        (
            "Feedback status: "
            f"{recommendation.feedback_status}"
        ),
    ]

    title = input_data.get("title")

    if (
        isinstance(title, str)
        and title.strip()
    ):
        content_parts.append(
            "Procedure title:\n"
            f"{title.strip()}"
        )

    description = input_data.get(
        "description"
    )

    if (
        isinstance(description, str)
        and description.strip()
    ):
        content_parts.append(
            "Procedure description:\n"
            f"{description.strip()}"
        )

    instructions = input_data.get(
        "instructions"
    )

    if (
        isinstance(instructions, str)
        and instructions.strip()
    ):
        content_parts.append(
            "User instructions:\n"
            f"{instructions.strip()}"
        )

    step_lines = []

    for step in steps:
        if not isinstance(step, dict):
            continue

        step_number = step.get(
            "step_number"
        )
        step_description = step.get(
            "description"
        )

        if (
            isinstance(step_number, int)
            and not isinstance(
                step_number,
                bool,
            )
            and isinstance(
                step_description,
                str,
            )
            and step_description.strip()
        ):
            step_lines.append(
                f"{step_number}. "
                f"{step_description.strip()}"
            )

    if not step_lines:
        raise ValueError(
            "AI recommendation does not "
            "contain valid final steps."
        )

    content_parts.append(
        "Final steps:\n"
        + "\n".join(step_lines)
    )

    return "\n\n".join(content_parts)


def load_embedding_model():
    global model, tokenizer

    if model is not None:
        return model, tokenizer

    config = AutoConfig.from_pretrained(
        MODEL_NAME,
        trust_remote_code=True,
    )

    config.use_memory_efficient_attention = False
    config.unpad_inputs = False

    tokenizer = AutoTokenizer.from_pretrained(
        MODEL_NAME,
        trust_remote_code=True,
    )

    model = AutoModel.from_pretrained(
        MODEL_NAME,
        config=config,
        trust_remote_code=True,
    )

    model = model.to(DEVICE)
    model.eval()

    return model, tokenizer

def generate_embedding(text, is_query=False):
    if not text or not text.strip():
        raise ValueError("Text cannot be empty.")

    model, tokenizer = load_embedding_model()

    prepared_text = text.strip()

    if is_query:
        prepared_text = f"query: {prepared_text}"

    inputs = tokenizer(
        [prepared_text],
        padding=True,
        truncation=True,
        return_tensors="pt",
        max_length=512,
    )

    inputs = {
        name: value.to(DEVICE)
        for name, value in inputs.items()
    }

    with torch.inference_mode():
        embedding = model(**inputs)[0][:, 0]

        embedding = torch.nn.functional.normalize(
            embedding,
            p=2,
            dim=1,
        )

    return embedding[0].cpu().tolist()
