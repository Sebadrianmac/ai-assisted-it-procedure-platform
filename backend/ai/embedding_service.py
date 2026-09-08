import torch
from transformers import (
    AutoConfig,
    AutoModel,
    AutoTokenizer,
)
from ai.models import KnowledgeBaseItem
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
        raise ValueError("Document does not contain text.")

    model, tokenizer = load_embedding_model()

    chunks = split_text_into_chunks(
        content,
        tokenizer,
    )

    indexed_items = []

    for chunk_number, chunk_content in enumerate(chunks):
        embedding = generate_embedding(chunk_content)

        knowledge_item, _ = (
            KnowledgeBaseItem.objects.update_or_create(
                document=document,
                chunk_number=chunk_number,
                defaults={
                    "content": chunk_content,
                    "embedding": embedding,
                },
            )
        )

        indexed_items.append(knowledge_item)

    KnowledgeBaseItem.objects.filter(
        document=document,
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