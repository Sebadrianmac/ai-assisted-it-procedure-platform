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

from ..validators import (
    validate_document_content
)
from django.shortcuts import get_object_or_404

@api_view(["GET", "POST"])
@permission_classes([
    IsAuthenticated,
    DocumentPermission,
])
def document_list(request):
    if request.method == "GET":
        documents = (
            Document.objects
            .select_related("uploaded_by")
            .order_by("-created_at")
        )

        data = [
            {
                "id": document.id,
                "title": document.title,
                "document_type": (
                    document.document_type
                ),
                "document_type_label": (
                    document
                    .get_document_type_display()
                ),
                "description": (
                    document.description
                ),
                "file_url": (
                    request.build_absolute_uri(
                        document.file.url
                    )
                    if document.file
                    else None
                ),
                "external_url": (
                    document.external_url
                ),
                "uploaded_by": {
                    "id": document.uploaded_by.id,
                    "username": (
                        document.uploaded_by.username
                    ),
                    "first_name": (
                        document.uploaded_by.first_name
                    ),
                    "last_name": (
                        document.uploaded_by.last_name
                    ),
                },
                "created_at": document.created_at,
                "updated_at": document.updated_at,
            }
            for document in documents
        ]

        return Response(
            data,
            status=status.HTTP_200_OK,
        )
    if request.method == "POST":
        validated_data, error_response = (
            validate_document_content(
                request.data,
                request.FILES,
            )
        )

        if error_response:
            return error_response

        document = Document.objects.create(
            title=validated_data["title"],
            document_type=(
                validated_data["document_type"]
            ),
            description=(
                validated_data["description"]
            ),
            file=validated_data["file"],
            external_url=(
                validated_data["external_url"]
            ),
            uploaded_by=request.user,
        )

        return Response(
            {
                "id": document.id,
                "title": document.title,
                "document_type": (
                    document.document_type
                ),
                "document_type_label": (
                    document
                    .get_document_type_display()
                ),
                "description": document.description,
                "file_url": (
                    request.build_absolute_uri(
                        document.file.url
                    )
                    if document.file
                    else None
                ),
                "external_url": (
                    document.external_url
                ),
                "uploaded_by": {
                    "id": document.uploaded_by.id,
                    "username": (
                        document.uploaded_by.username
                    ),
                    "first_name": (
                        document.uploaded_by.first_name
                    ),
                    "last_name": (
                        document.uploaded_by.last_name
                    ),
                },
                "created_at": document.created_at,
                "updated_at": document.updated_at,
            },
            status=status.HTTP_201_CREATED,
        )

@api_view(["PATCH"])
@permission_classes([
    IsAuthenticated,
    DocumentPermission
])
def document_update(request):
    if not request.data("step_id"):
        return

@api_view(["DELETE"])
@permission_classes([
    IsAuthenticated,
    DocumentPermission,
])
def document_delete(request, document_id):
    document = get_object_or_404(
        Document,
        id=document_id,
    )

    if document.procedure_steps.exists():
        return Response(
            {
                "detail": (
                    "Document cannot be deleted "
                    "because it is linked to "
                    "procedure steps."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
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