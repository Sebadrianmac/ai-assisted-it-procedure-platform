from requests import RequestException
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from procedures.serializers import serialize_document

from .generation_service import generate_steps_from_input
from .rag_service import generate_rag_answer
from .search_service import semantic_search


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
def generate_procedure_steps(request):
    title = request.data.get("title", "")
    description = request.data.get("description", "")
    instructions = request.data.get("instructions", "")

    if not isinstance(title, str):
        return Response(
            {"detail": "Title must be text."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    title = title.strip()
    if not title:
        return Response(
            {"detail": "Title is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not isinstance(description, str):
        return Response(
            {"detail": "Description must be text."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    description = description.strip()
    if not description:
        return Response(
            {"detail": "Description is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not isinstance(instructions, str):
        return Response(
            {"detail": "Instructions must be text."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    instructions = instructions.strip()

    try:
        result = generate_steps_from_input(
            title=title,
            description=description,
            instructions=instructions,
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
        print("Failed to generate procedure steps:", error)

        return Response(
            {"detail": "Failed to generate AI response."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(result, status=status.HTTP_200_OK)
