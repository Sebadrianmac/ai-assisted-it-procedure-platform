from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from procedures.serializers import serialize_document

from .search_service import semantic_search
from requests import RequestException
from .rag_service import generate_rag_answer

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def recommend_documents(request):
    text = str(request.data.get("text", "")).strip()

    if not text:
        return Response(
            {"detail": "Text is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        limit = int(request.data.get("limit", 5))
    except (TypeError, ValueError):
        return Response(
            {"detail": "Limit must be a number."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    limit = max(1, min(limit, 10))

    results = semantic_search(
        query=text,
        limit=limit * 10,
    )

    recommendations = []
    seen_document_ids = set()

    for item in results:
        document = item.document

        if document.id in seen_document_ids:
            continue

        seen_document_ids.add(document.id)

        document_data = serialize_document(
            document,
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

        document_data["matched_content"] = item.content

        recommendations.append(document_data)

        if len(recommendations) >= limit:
            break

    return Response(
        {
            "query": text,
            "count": len(recommendations),
            "recommendations": recommendations,
        },
        status=status.HTTP_200_OK,
    )
    
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_procedure(request):
    question = str(request.data.get("question", "")).strip()

    if not question:
        return Response(
            {"detail": "Question is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        limit = int(request.data.get("limit", 5))
    except (TypeError, ValueError):
        return Response(
            {"detail": "Limit must be a number."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    limit = max(1, min(limit, 10))

    try:
        result = generate_rag_answer(
            question=question,
            limit=limit,
        )
        
    except ValueError as error:
        return Response(
            {"detail": str(error)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except RequestException as error:
        print("Local AI server error:", error)

        return Response(
            {"detail": "Local AI server is unavailable."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except Exception as error:
        print("Failed to generate RAG answer:", error)

        return Response(
            {"detail": "Failed to generate AI response."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(result, status=status.HTTP_200_OK)