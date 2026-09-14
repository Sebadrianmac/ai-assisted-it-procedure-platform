import torch
from transformers import (
    AutoConfig,
    AutoModel,
    AutoTokenizer,
)
from ai.models import KnowledgeBaseItem, KnowledgeSource, SourceType
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
        part.strip()
        for part in content_parts
        if part and part.strip()
    )

    if not content:
        raise ValueError(
            "Document does not contain text."
        )

    source, _ = KnowledgeSource.objects.get_or_create(
        source_type=SourceType.DOCUMENT,
        document=document,
        defaults={
            "is_active": True,
        },
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
