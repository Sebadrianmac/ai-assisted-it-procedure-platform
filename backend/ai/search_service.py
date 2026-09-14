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
    
def search_relevant_documents(
    text,
    limit=3,
    minimum_similarity=0.3,
):
    results = semantic_search(
        query=text,
        limit=limit * 10,
        source_type=SourceType.DOCUMENT,
    )

    recommendations = []
    seen_document_ids = set()

    for item in results:
        document = item.source.document
        similarity = 1 - float(item.distance)

        if document.id in seen_document_ids:
            continue

        if similarity < minimum_similarity:
            continue

        seen_document_ids.add(document.id)

        recommendations.append(
            {
                "document": document,
                "similarity": round(
                    similarity,
                    4,
                ),
                "distance": round(
                    float(item.distance),
                    4,
                ),
                "matched_content": item.content,
            }
        )

        if len(recommendations) >= limit:
            break

    return recommendations