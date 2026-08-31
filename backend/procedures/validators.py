from rest_framework import status
from rest_framework.response import Response

from .models import Document


def validate_procedure_content(request_data):
    title = request_data.get("title", "")
    description = request_data.get("description", "")
    steps = request_data.get("steps", [])

    if not isinstance(title, str):
        return None, Response(
            {"title": "Title must be a string."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    title = title.strip()

    if not title:
        return None, Response(
            {"title": "Title is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not isinstance(description, str):
        return None, Response(
            {"description": "Description must be a string."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    description = description.strip()

    if not isinstance(steps, list):
        return None, Response(
            {"steps": "Steps must be a list."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    validated_steps = []

    for index, step_data in enumerate(steps, start=1):
        if not isinstance(step_data, dict):
            return None, Response(
                {"steps": f"Step {index} must be an object."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        step_description = step_data.get("description", "")

        if not isinstance(step_description, str):
            return None, Response(
                {"steps": f"Step {index} description must be a string."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        step_description = step_description.strip()

        if not step_description:
            return None, Response(
                {"steps": f"Step {index} cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        document_ids = step_data.get("document_ids", [])

        if not isinstance(document_ids, list):
            return None, Response(
                {"steps": f"Step {index} document_ids must be a list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invalid_document_ids = [
            document_id
            for document_id in document_ids
            if not isinstance(document_id, int) or isinstance(document_id, bool)
        ]

        if invalid_document_ids:
            return None, Response(
                {"steps": f"Step {index} document IDs must be integers."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        unique_document_ids = list(dict.fromkeys(document_ids))
        documents = list(Document.objects.filter(id__in=unique_document_ids))
        found_document_ids = {document.id for document in documents}
        missing_document_ids = set(unique_document_ids) - found_document_ids

        if missing_document_ids:
            return None, Response(
                {
                    "steps": f"Step {index} contains unknown document IDs.",
                    "missing_document_ids": sorted(missing_document_ids),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        validated_steps.append(
            {
                "step_number": index,
                "description": step_description,
                "documents": documents,
            }
        )

    return {
        "title": title,
        "description": description,
        "steps": validated_steps,
    }, None


def validate_document_content(request_data, request_files):
    title = request_data.get("title")
    document_type = request_data.get("document_type")
    description = request_data.get("description", "")
    external_url = request_data.get("external_url", "")
    file = request_files.get("file")

    if not isinstance(title, str):
        return None, Response(
            {"title": "Title must be a string"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    title = title.strip()

    if not title:
        return None, Response(
            {"title": "Title is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if document_type not in Document.DocumentType.values:
        return None, Response(
            {
                "document_type": "Invalid document type.",
                "allowed_values": Document.DocumentType.values,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not isinstance(description, str):
        return None, Response(
            {"description": "Description must be a string."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not isinstance(external_url, str):
        return None, Response(
            {"external_url": "External URL must be a string."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    description = description.strip()
    external_url = external_url.strip()

    if file is None and not external_url:
        return None, Response(
            {"document": "A file or external URL is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    validated_data = {
        "title": title,
        "document_type": document_type,
        "description": description,
        "file": file,
        "external_url": external_url,
    }

    return validated_data, None


def validate_document_update(request_data, request_files):
    validated_data = {}

    if "title" in request_data:
        title = request_data.get("title")

        if not isinstance(title, str):
            return None, Response(
                {"title": "Title must be a string."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        title = title.strip()

        if not title:
            return None, Response(
                {"title": "Title cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        validated_data["title"] = title

    if "document_type" in request_data:
        document_type = request_data.get("document_type")

        if document_type not in Document.DocumentType.values:
            return None, Response(
                {
                    "document_type": "Invalid document type.",
                    "allowed_values": Document.DocumentType.values,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        validated_data["document_type"] = document_type

    if "description" in request_data:
        description = request_data.get("description")

        if not isinstance(description, str):
            return None, Response(
                {"description": "Description must be a string."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        validated_data["description"] = description.strip()

    if "external_url" in request_data:
        external_url = request_data.get("external_url")

        if not isinstance(external_url, str):
            return None, Response(
                {"external_url": "External URL must be a string."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        validated_data["external_url"] = external_url.strip()

    if "file" in request_files:
        validated_data["file"] = request_files.get("file")

    if not validated_data:
        return None, Response(
            {"detail": "No document fields were provided."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return validated_data, None
