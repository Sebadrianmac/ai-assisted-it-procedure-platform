from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import (
    IsAuthenticated,
)
from rest_framework.response import Response

from ..models import Document
from ..permissions import DocumentPermission
from ..serializers import serialize_document
from ..validators import validate_document_content, validate_document_update


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated, DocumentPermission])
def document_list(request):
    if request.method == "GET":
        documents = Document.objects.select_related("uploaded_by").order_by("-created_at")

        data = [serialize_document(document, request) for document in documents]

        return Response(data, status=status.HTTP_200_OK)

    validated_data, error_response = (
        validate_document_content(
            request.data,
            request.FILES,
        )
    )

    if error_response:
        return error_response

    document = Document.objects.create(
        title=validated_data[
            "title"
        ],
        document_type=validated_data[
            "document_type"
        ],
        description=validated_data[
            "description"
        ],
        file=validated_data[
            "file"
        ],
        external_url=validated_data[
            "external_url"
        ],
        uploaded_by=request.user,
    )

    return Response(
        serialize_document(
            document,
            request,
        ),
        status=status.HTTP_201_CREATED,
    )


@api_view([
    "PATCH",
    "DELETE",
])
@permission_classes([
    IsAuthenticated,
    DocumentPermission,
])
def document_detail(
    request,
    document_id,
):
    document = get_object_or_404(
        Document.objects.select_related(
            "uploaded_by"
        ),
        id=document_id,
    )

    if request.method == "PATCH":
        return update_document(
            request,
            document,
        )

    return delete_document(
        document,
    )


def update_document(
    request,
    document,
):
    validated_data, error_response = (
        validate_document_update(
            request.data,
            request.FILES,
        )
    )

    if error_response:
        return error_response

    old_file = document.file

    for field, value in (
        validated_data.items()
    ):
        setattr(
            document,
            field,
            value,
        )

    document.save()

    file_was_replaced = (
        "file" in validated_data
        and old_file
        and old_file.name
        != document.file.name
    )

    if file_was_replaced:
        old_file.delete(
            save=False,
        )

    return Response(
        serialize_document(
            document,
            request,
        ),
        status=status.HTTP_200_OK,
    )


def delete_document(document):
    if document.procedure_steps.exists():
        return Response(
            {
                "detail": (
                    "Document cannot be deleted "
                    "because it is linked to "
                    "procedure steps."
                ),
            },
            status=(
                status.HTTP_400_BAD_REQUEST
            ),
        )

    document_file = document.file
    document.delete()

    if document_file:
        document_file.delete(
            save=False,
        )

    return Response(
        status=status.HTTP_204_NO_CONTENT,
    )