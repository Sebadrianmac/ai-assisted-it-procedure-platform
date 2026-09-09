## Semantic search in pgvector
from pgvector.django import CosineDistance
from ai.embedding_service import generate_embedding
from ai.models import KnowledgeBaseItem


def semantic_search(query, limit=5):
    if not query or not query.strip():
        raise ValueError(
            "Search query cannot be empty."
        )

    query_embedding = generate_embedding(
        query,
        is_query=True,
    )

    results = (
        KnowledgeBaseItem.objects
        .select_related("document")
        .annotate(
            distance=CosineDistance(
                "embedding",
                query_embedding,
            )
        )
        .order_by("distance")[:limit]
    )

    return results