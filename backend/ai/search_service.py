## Semantic search in pgvector
from pgvector.django import CosineDistance
from ai.embedding_service import generate_embedding
from ai.models import KnowledgeBaseItem, SourceType

def semantic_search(
    query,
    limit=5,
    source_type=None,
):
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
        .select_related(
            "source",
            "source__document",
            "source__procedure_version",
        )
        .filter(
            source__is_active=True,
        )
    )

    if source_type:
        results = results.filter(
            source__source_type=source_type,
        )

    results = (
        results
        .annotate(
            distance=CosineDistance(
                "embedding",
                query_embedding,
            )
        )
        .order_by("distance")[:limit]
    )

    return results

def search_similar_procedures(
    title="",
    description="",
    instructions="",
    limit=3
):
    search_query = " ".join(
        part.strip()
        for part in [
            title,
            description,
            instructions,
        ]
        if part and part.strip()
    )
    if not search_query:
        raise ValueError(
            "Procedure information cannot be empty."
        )
    return semantic_search(
        query=search_query,
        limit=limit,
        source_type=SourceType.PROCEDURE
    )
    