from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import (
    IsAuthenticated,
)
from django.utils import timezone
from rest_framework.response import Response

from ..permissions import CanApproveProcedure
from ..models import (
    ProcedureVersion,
    StatusChoices
)

from django.shortcuts import get_object_or_404
from django.db import transaction
from ..serializers import (
    serialize_version,
)

@api_view(["GET"])
@permission_classes([
    IsAuthenticated,
    CanApproveProcedure,
])
def procedure_review_list(request):
    versions = (
        ProcedureVersion.objects
        .filter(
            status=StatusChoices.CREATED,
        )
        .select_related(
            "procedure",
            "created_by",
        )
        .prefetch_related("steps")
        .order_by("submitted_at")
    )

    data = [
        {
            "id": version.id,
            "procedure_id": (
                version.procedure_id
            ),
            "title": version.title,
            "description": (
                version.description
            ),
            "status": version.status,
            "status_label": (
                version.get_status_display()
            ),
            "steps_count":(
                version.steps.count()
            ),
            "version_number": (
                version.version_number
            ),
            "change_type": (
                version.change_type
            ),
            "submitted_at": (
                version.submitted_at
            ),
            "created_by": {
                "id": version.created_by.id,
                "username": (
                    version.created_by.username
                ),
                "first_name": (
                    version.created_by.first_name
                ),
                "last_name": (
                    version.created_by.last_name
                ),
            },
        }
        for version in versions
    ]

    return Response(
        data,
        status=status.HTTP_200_OK,
    )
@api_view(["GET", "PATCH"])
@permission_classes([
    IsAuthenticated,
    CanApproveProcedure,
])
def procedure_review_detail(request, version_id):
    version = get_object_or_404(
        ProcedureVersion.objects
        .select_related(
            "procedure",
            "created_by",
        )
        .prefetch_related(
            "steps",
        ),
        id=version_id,
        status=StatusChoices.CREATED,
    )

    if request.method == "GET":
        return Response(
    serialize_version(
        version,
        include_steps=True,
    ),
    status=status.HTTP_200_OK,
)

    if request.method == "PATCH":
        action = request.data.get("action")

        if action not in [
            "approve",
            "reject",
            "request_clarification",
        ]:
            return Response(
                {
                    "action": (
                        "Action is not recognised."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if action in [
            "reject",
            "request_clarification",
        ]:
            new_comment = request.data.get(
                "review_comment"
            )

            if new_comment is None:
                return Response(
                    {
                        "review_comment": (
                            "Review comment is required."
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not isinstance(new_comment, str):
                return Response(
                    {
                        "review_comment": (
                            "Review comment must be "
                            "a string."
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            new_comment = new_comment.strip()

            if not new_comment:
                return Response(
                    {
                        "review_comment": (
                            "Review comment cannot "
                            "be empty."
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            version.reviewed_by = request.user
            version.reviewed_at = timezone.now()
            version.review_comment = new_comment
            version.is_current = False

            if action == "reject":
                version.status = StatusChoices.REJECTED
            else:
                version.status = (
                    StatusChoices.CLARIFICATION_NEEDED
                )

            version.save()

        elif action == "approve":
            (
                ProcedureVersion.objects
                .filter(
                    procedure=version.procedure,
                    is_current=True,
                )
                .update(is_current=False)
            )

            version.reviewed_by = request.user
            version.reviewed_at = timezone.now()
            version.review_comment = ""
            version.status = StatusChoices.COMPLETED
            version.is_current = True
            version.save()

        return Response(
            {
                "message": (
                    "Procedure version reviewed "
                    "successfully."
                ),
                "id": version.id,
                "status": version.status,
                "status_label": (
                    version.get_status_display()
                ),
                "is_current": version.is_current,
                "reviewed_at": version.reviewed_at,
                "review_comment": version.review_comment,
            },
            status=status.HTTP_200_OK,
        )
