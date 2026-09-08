from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import (
    IsAuthenticated,
)
from rest_framework.response import Response

from procedures.serializers import (
    serialize_document,
)

from .search_service import semantic_search


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def recommend_documents(request):
    text = str(
        request.data.get("text", "")
    ).strip()

    if not text:
        return Response(
            {
                "detail": (
                    "Text is required."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        limit = int(
            request.data.get("limit", 5)
        )
    except (TypeError, ValueError):
        return Response(
            {
                "detail": (
                    "Limit must be a number."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    limit = max(1, min(limit, 10))

    results = semantic_search(
        query=text,
        limit=limit,
    )

    recommendations = []

    for item in results:
        document_data = serialize_document(
            item.document,
            request,
        )

        document_data["distance"] = round(
            float(item.distance),
            4,
        )

        document_data["similarity"] = round(
            1 - float(item.distance),
            4,
        )

        recommendations.append(
            document_data
        )

    return Response(
        {
            "query": text,
            "count": len(recommendations),
            "recommendations": recommendations,
        },
        status=status.HTTP_200_OK,
    )