import torch

from transformers import (
    AutoConfig,
    AutoModel,
    AutoTokenizer,
)
from ai.models import KnowledgeBaseItem

MODEL_NAME = (
    "Snowflake/"
    "snowflake-arctic-embed-m-v2.0"
)

DEVICE = (
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)

model = None
tokenizer = None


def index_document(document):
    content = f"""
    {document.title}
    {document.description}
    """.strip()

    if not content:
        raise ValueError(
            "Document does not contain text."
        )

    embedding = generate_embedding(content)

    knowledge_item, created = (
        KnowledgeBaseItem.objects.update_or_create(
            document=document,
            chunk_number=0,
            defaults={
                "content": content,
                "embedding": embedding,
            },
        )
    )

    return knowledge_item, created

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