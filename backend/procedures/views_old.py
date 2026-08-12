from django.db import transaction
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    Procedure,
    ProcedureStep,
    ProcedureVersion,
    StatusChoices,
)
from .permissions import ProcedurePermission


def serialize_user(user):
    if user is None:
        return None

    return {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
    }


def serialize_step(step):
    return {
        "id": step.id,
        "step_number": step.step_number,
        "description": step.description,
    }


def serialize_version(
    version,
    include_steps=False,
):
    if version is None:
        return None

    version_data = {
        "id": version.id,
        "title": version.title,
        "description": version.description,
        "status": version.status,
        "status_label": (
            version.get_status_display()
        ),

        "change_type": version.change_type,
        "version_major": version.version_major,
        "version_minor": version.version_minor,
        "version_number": version.version_number,
        "is_current": version.is_current,

        "created_by": serialize_user(
            version.created_by
        ),
        "submitted_at": version.submitted_at,
        "reviewed_by": serialize_user(
            version.reviewed_by
        ),
        "reviewed_at": version.reviewed_at,
        "review_comment": version.review_comment,
        "created_at": version.created_at,
        "updated_at": version.updated_at,
    }

    if include_steps:
        version_data["steps"] = [
            serialize_step(step)
            for step in version.steps.all()
        ]

    return version_data

def get_current_version(procedure):

    return next(
        (
            version
            for version in procedure.versions.all()
            if version.is_current
        ),
        None,
    )


def get_active_version(procedure):

    active_statuses = [
        StatusChoices.IN_PROGRESS,
        StatusChoices.CREATED,
        StatusChoices.CLARIFICATION_NEEDED,
    ]

    return next(
        (
            version
            for version in procedure.versions.all()
            if version.status in active_statuses
        ),
        None,
    )


def get_display_version(procedure):

    current_version = get_current_version(
        procedure
    )

    if current_version:
        return current_version

    active_version = get_active_version(
        procedure
    )

    if active_version:
        return active_version

    versions = list(procedure.versions.all())

    return versions[0] if versions else None


def calculate_next_version(
    procedure,
    change_type,
):

    numbered_versions = (
        ProcedureVersion.objects
        .filter(
            procedure=procedure,
            version_major__isnull=False,
            version_minor__isnull=False,
        )
    )

    current_version = (
        numbered_versions
        .filter(is_current=True)
        .first()
    )

    if current_version is None:
        if not numbered_versions.exists():
            return 1, 0

        last_version = (
            numbered_versions
            .order_by(
                "-version_major",
                "-version_minor",
            )
            .first()
        )

        if change_type == (
            ProcedureVersion.ChangeType.MAJOR
        ):
            return (
                last_version.version_major + 1,
                0,
            )

        return (
            last_version.version_major,
            last_version.version_minor + 1,
        )

    if change_type == (
        ProcedureVersion.ChangeType.MAJOR
    ):
        highest_major = (
            numbered_versions
            .order_by("-version_major")
            .values_list(
                "version_major",
                flat=True,
            )
            .first()
        )

        return highest_major + 1, 0

    same_major_versions = (
        numbered_versions
        .filter(
            version_major=(
                current_version.version_major
            ),
        )
        .order_by("-version_minor")
    )

    last_minor_version = (
        same_major_versions.first()
    )

    return (
        current_version.version_major,
        last_minor_version.version_minor + 1,
    )

def serialize_procedure_list_item(procedure):
    display_version = get_display_version(
        procedure
    )

    active_version = get_active_version(
        procedure
    )

    current_version = get_current_version(
        procedure
    )

    return {
        "id": procedure.id,

        "title": (
            display_version.title
            if display_version
            else ""
        ),

        "description": (
            display_version.description
            if display_version
            else ""
        ),

        "status": (
            display_version.status
            if display_version
            else None
        ),

        "status_label": (
            display_version.get_status_display()
            if display_version
            else None
        ),

        "version_number": (
            display_version.version_number
            if display_version
            else None
        ),

        "created_by": serialize_user(
            procedure.created_by
        ),

        "created_at": procedure.created_at,
        "updated_at": procedure.updated_at,

        "current_version": serialize_version(
            current_version
        ),

        "active_version": serialize_version(
            active_version
        ),
    }


def serialize_procedure_details(procedure):
    current_version = get_current_version(
        procedure
    )

    active_version = get_active_version(
        procedure
    )

    display_version = (
        active_version
        or current_version
    )

    return {
        "id": procedure.id,

        "title": (
            display_version.title
            if display_version
            else ""
        ),

        "description": (
            display_version.description
            if display_version
            else ""
        ),

        "status": (
            display_version.status
            if display_version
            else None
        ),

        "status_label": (
            display_version.get_status_display()
            if display_version
            else None
        ),

        "created_by": serialize_user(
            procedure.created_by
        ),

        "created_at": procedure.created_at,
        "updated_at": procedure.updated_at,

        "current_version": serialize_version(
            current_version,
            include_steps=True,
        ),

        "active_version": serialize_version(
            active_version,
            include_steps=True,
        ),

        "versions": [
            serialize_version(
                version,
                include_steps=True,
            )
            for version in procedure.versions.all()
        ],
    }

def validate_procedure_content(request_data):
    title = request_data.get(
        "title",
        "",
    )

    description = request_data.get(
        "description",
        "",
    )

    steps = request_data.get(
        "steps",
        [],
    )

    if not isinstance(title, str):
        return None, Response(
            {
                "title": (
                    "Title must be a string."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    title = title.strip()

    if not title:
        return None, Response(
            {
                "title": "Title is required.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not isinstance(description, str):
        return None, Response(
            {
                "description": (
                    "Description must be a string."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    description = description.strip()

    if not isinstance(steps, list):
        return None, Response(
            {
                "steps": "Steps must be a list.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    validated_steps = []

    for index, step_data in enumerate(
        steps,
        start=1,
    ):
        if not isinstance(step_data, dict):
            return None, Response(
                {
                    "steps": (
                        f"Step {index} must "
                        "be an object."
                    ),
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        step_description = step_data.get(
            "description",
            "",
        )

        if not isinstance(
            step_description,
            str,
        ):
            return None, Response(
                {
                    "steps": (
                        f"Step {index} description "
                        "must be a string."
                    ),
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        step_description = (
            step_description.strip()
        )

        if not step_description:
            return None, Response(
                {
                    "steps": (
                        f"Step {index} cannot "
                        "be empty."
                    ),
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        validated_steps.append({
            "step_number": index,
            "description": step_description,
        })

    return {
        "title": title,
        "description": description,
        "steps": validated_steps,
    }, None

@api_view(["GET"])
@permission_classes([
    IsAuthenticated,
])
def status_list(request):
    statuses = [
        {
            "value": value,
            "label": label,
        }
        for value, label
        in StatusChoices.choices
    ]

    return Response(
        statuses,
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

    if request.method == "POST":
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
        version_major=None,
        version_minor=None,
        is_current=False,
    )

    for step_data in validated_data["steps"]:
        ProcedureStep.objects.create(
            procedure_version=draft,
            step_number=step_data[
                "step_number"
            ],
            description=step_data[
                "description"
            ],
        )

    return Response(
        serialize_procedure_details(
            load_procedure(procedure.id)
        ),
        status=status.HTTP_201_CREATED,
    )



def load_procedure(procedure_id):
    return get_object_or_404(
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
                    .prefetch_related("steps")
                    .order_by("-created_at")
                ),
            )
        ),
        id=procedure_id,
    )


@api_view(["GET", "PATCH", "DELETE"])
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
            request=request,
            procedure=procedure,
        )

    if request.method == "DELETE":
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

    allowed_actions = [
        "save_draft",
        "submit_for_approval",
    ]

    if action not in allowed_actions:
        return Response(
            {
                "action": (
                    "Action must be "
                    "save_draft or "
                    "submit_for_approval."
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
                    "This procedure does not "
                    "have an active draft."
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
                    "for approval and cannot "
                    "be edited."
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

    if action == "submit_for_approval":
        if not validated_data["steps"]:
            return Response(
                {
                    "steps": (
                        "At least one step is "
                        "required before submitting."
                    ),
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

    active_version.title = (
        validated_data["title"]
    )

    active_version.description = (
        validated_data["description"]
    )

    active_version.steps.all().delete()

    for step_data in validated_data["steps"]:
        ProcedureStep.objects.create(
            procedure_version=active_version,
            step_number=step_data[
                "step_number"
            ],
            description=step_data[
                "description"
            ],
        )

    if action == "save_draft":
        if (
            active_version.status
            == StatusChoices
            .CLARIFICATION_NEEDED
        ):
            active_version.status = (
                StatusChoices.IN_PROGRESS
            )

        active_version.save()

    if action == "submit_for_approval":
        change_type = request.data.get(
            "change_type",
        )

        if change_type not in (
            ProcedureVersion.ChangeType.MINOR,
            ProcedureVersion.ChangeType.MAJOR,
        ):
            return Response(
                {
                    "change_type": (
                        "Change type must be "
                        "minor or major."
                    ),
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        if (
            active_version.version_major
            is None
            or active_version.version_minor
            is None
        ):
            major, minor = (
                calculate_next_version(
                    procedure=procedure,
                    change_type=change_type,
                )
            )

            active_version.version_major = major
            active_version.version_minor = minor

        active_version.change_type = (
            change_type
        )

        active_version.status = (
            StatusChoices.CREATED
        )

        active_version.submitted_at = (
            timezone.now()
        )

        active_version.reviewed_by = None
        active_version.reviewed_at = None
        active_version.review_comment = ""

        active_version.save()

    procedure.save(
        update_fields=["updated_at"]
    )

    updated_procedure = load_procedure(
        procedure.id
    )

    return Response(
        serialize_procedure_details(
            updated_procedure
        ),
        status=status.HTTP_200_OK,
    )