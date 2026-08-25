from django.db import transaction
from django.db.models import Prefetch
from django.utils import timezone
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

from ..models import (
    Procedure,
    ProcedureVersion,
    ProcedureStep,
    StatusChoices,
)
from ..permissions import ProcedurePermission, CanAddProcedureVersion
from ..serializers import (
    serialize_procedure_details,
    serialize_procedure_list_item,
)
from ..services import (
    calculate_next_version,
    load_procedure,
    replace_version_steps,
)
from ..validators import (
    validate_procedure_content,
)


@api_view(["GET"])
@permission_classes([
    IsAuthenticated,
])
def status_list(request):
    return Response(
        [
            {
                "value": value,
                "label": label,
            }
            for value, label
            in StatusChoices.choices
        ],
        status=status.HTTP_200_OK,
    )


@api_view(["GET", "POST"])
@permission_classes([
    IsAuthenticated,
    ProcedurePermission,
])
def procedure_list(request):
    if request.method == "GET":
        return get_procedure_list()

    return create_procedure(request)


def get_procedure_list():
    procedures = (
        Procedure.objects
        .select_related("created_by")
        .prefetch_related(
            Prefetch(
                "versions",
                queryset=(
                    ProcedureVersion.objects
                    .select_related(
                        "created_by",
                        "reviewed_by",
                    )
                    .order_by("-created_at")
                ),
            )
        )
        .order_by("-updated_at")
    )

    data = [
        serialize_procedure_list_item(
            procedure
        )
        for procedure in procedures
    ]

    return Response(
        data,
        status=status.HTTP_200_OK,
    )


@transaction.atomic
def create_procedure(request):
    validated_data, error_response = (
        validate_procedure_content(
            request.data
        )
    )

    if error_response:
        return error_response

    procedure = Procedure.objects.create(
        created_by=request.user,
    )

    draft = ProcedureVersion.objects.create(
        procedure=procedure,
        title=validated_data["title"],
        description=(
            validated_data["description"]
        ),
        status=StatusChoices.IN_PROGRESS,
        created_by=request.user,
        is_current=False,
    )

    replace_version_steps(
        draft,
        validated_data["steps"],
    )

    return Response(
        serialize_procedure_details(
            load_procedure(procedure.id)
        ),
        status=status.HTTP_201_CREATED,
    )


@api_view([
    "GET",
    "PATCH",
    "DELETE",
])
@permission_classes([
    IsAuthenticated,
    ProcedurePermission,
])
def procedure_details(
    request,
    procedure_id,
):
    procedure = load_procedure(
        procedure_id
    )

    if request.method == "GET":
        return Response(
            serialize_procedure_details(
                procedure
            ),
            status=status.HTTP_200_OK,
        )

    if request.method == "PATCH":
        return update_procedure(
            request,
            procedure,
        )

    procedure.delete()

    return Response(
        status=status.HTTP_204_NO_CONTENT,
    )

@transaction.atomic
def update_procedure(
    request,
    procedure,
):
    action = request.data.get(
        "action",
        "save_draft",
    )

    if action not in [
        "save_draft",
        "submit_for_approval",
    ]:
        return Response(
            {
                "action": (
                    "Action must be save_draft "
                    "or submit_for_approval."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    active_version = (
        ProcedureVersion.objects
        .select_for_update()
        .filter(
            procedure=procedure,
            status__in=[
                StatusChoices.IN_PROGRESS,
                StatusChoices.CREATED,
                StatusChoices
                .CLARIFICATION_NEEDED,
            ],
        )
        .prefetch_related("steps")
        .first()
    )

    if active_version is None:
        return Response(
            {
                "detail": (
                    "This procedure has no "
                    "active draft."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if (
        active_version.status
        == StatusChoices.CREATED
    ):
        return Response(
            {
                "detail": (
                    "This version is waiting "
                    "for approval."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    content_data = {
        "title": request.data.get(
            "title",
            active_version.title,
        ),
        "description": request.data.get(
            "description",
            active_version.description,
        ),
        "steps": request.data.get(
            "steps",
            [
                {
                    "description": (
                        step.description
                    ),
                }
                for step
                in active_version.steps.all()
            ],
        ),
    }

    validated_data, error_response = (
        validate_procedure_content(
            content_data
        )
    )

    if error_response:
        return error_response

    if (
        action == "submit_for_approval"
        and not validated_data["steps"]
    ):
        return Response(
            {
                "steps": (
                    "At least one step is "
                    "required before submitting."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if action == "save_draft":
        active_version.status = (
            StatusChoices.IN_PROGRESS
        )

    if action == "submit_for_approval":
        if (
            active_version.version_number
            is None
        ):
            current_version = (
                ProcedureVersion.objects
                .filter(
                    procedure=procedure,
                    is_current=True,
                    status=(
                        StatusChoices.COMPLETED
                    ),
                )
                .first()
            )

            if current_version is None:
                active_version.version_major = 1
                active_version.version_minor = 0
                active_version.change_type = None

            else:
                change_type = request.data.get(
                    "change_type"
                )

                if change_type not in [
                    ProcedureVersion
                    .ChangeType.MINOR,
                    ProcedureVersion
                    .ChangeType.MAJOR,
                ]:
                    return Response(
                        {
                            "change_type": (
                                "Change type must be "
                                "minor or major."
                            ),
                        },
                        status=(
                            status
                            .HTTP_400_BAD_REQUEST
                        ),
                    )

                major, minor = (
                    calculate_next_version(
                        procedure,
                        change_type,
                    )
                )

                active_version.version_major = (
                    major
                )
                active_version.version_minor = (
                    minor
                )
                active_version.change_type = (
                    change_type
                )

        active_version.status = (
            StatusChoices.CREATED
        )

        active_version.submitted_at = (
            timezone.now()
        )
    active_version.title = (
        validated_data["title"]
    )

    active_version.description = (
        validated_data["description"]
    )

    replace_version_steps(
        active_version,
        validated_data["steps"],
    )

    active_version.save()

    procedure.save(
        update_fields=["updated_at"]
    )

    return Response(
        serialize_procedure_details(
            load_procedure(procedure.id)
        ),
        status=status.HTTP_200_OK,
    )
@api_view([
    "POST",
])
@permission_classes([
    IsAuthenticated,
    CanAddProcedureVersion,
])
@transaction.atomic
def procedure_revision_create(request, procedure_id):
    procedure =  get_object_or_404(
        Procedure,
        id=procedure_id
        )
    current_version = (
        procedure.versions.filter(
            is_current = True,
            status = StatusChoices.COMPLETED
        )
        .first()
    )
    if current_version is None:
        return Response(
            {
                "message": "Procedure has no current approved version."
            },
            status=status.HTTP_400_BAD_REQUEST
            )
    
    active_revision_exists = (
        procedure.versions
        .filter(
            status__in=[
                StatusChoices.IN_PROGRESS,
                StatusChoices.CREATED,
                StatusChoices.CLARIFICATION_NEEDED,
            ]
        ).exists()

    )
    if active_revision_exists: 
        return Response(
            {
                "message": "Procedure already has an active revision."
            },
            status=status.HTTP_409_CONFLICT
        )
    validated_content, validation_error = (
        validate_procedure_content(request.data)
    )
    if validation_error:
        return validation_error

    action = request.data.get("action")
    if action not in [
        "save_draft",
        "submit_for_approval",
    ]:
        return Response(
            {
                "action": (
                    "Action must be save_draft "
                    "or submit_for_approval."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    change_type = None
    new_version_major = None
    new_version_minor = None

    if action == "submit_for_approval":
        change_type = request.data.get(
            "change_type"
        )

        if change_type == (
            ProcedureVersion.ChangeType.MAJOR
        ):
            new_version_major = (
                current_version.version_major
                + 1
            )
            new_version_minor = 0

        elif change_type == (
            ProcedureVersion.ChangeType.MINOR
        ):
            new_version_major = (
                current_version.version_major
            )
            new_version_minor = (
                current_version.version_minor
                + 1
            )
    
        else:
            return Response({
                "change_type": "Change type must be minor or major."
            },
            status=status.HTTP_400_BAD_REQUEST
            )
        new_status = StatusChoices.CREATED
        submitted_at = timezone.now()

    elif action == "save_draft":
        new_status = StatusChoices.IN_PROGRESS
        submitted_at = None

    new_version = (
        ProcedureVersion.objects.create(
            procedure=procedure,
            title=validated_content["title"],
            description=(
                validated_content["description"]
            ),
            status=new_status,
            change_type=change_type,
            version_major= new_version_major,
            version_minor = new_version_minor,
            is_current = False,
            created_by = request.user,
            submitted_at=submitted_at,
        )
    )
    for step_data in validated_content["steps"]:
        ProcedureStep.objects.create(
            procedure_version=new_version,
            step_number=step_data[
                "step_number"
            ],
            description=step_data[
                "description"
            ],
        )
    procedure.save(
        update_fields=["updated_at"]
    )
    return Response(
        serialize_procedure_details(
            procedure
        ),
        status=status.HTTP_201_CREATED,
    )