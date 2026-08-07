from django.db import transaction

from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import (
    IsAuthenticated,
)
from rest_framework.response import Response

from .models import (
    Procedure,
    ProcedureStep,
    ProcedureVersion,
)
from .permissions import ProcedurePermission


@api_view(["GET", "POST"])
@permission_classes([
    IsAuthenticated,
    ProcedurePermission,
])
def procedure_list(request):
    if request.method == "GET":
        procedures = (
            Procedure.objects
            .select_related("created_by")
            .all()
        )

        data = []

        for procedure in procedures:
            data.append({
                "id": procedure.id,
                "title": procedure.title,
                "description": (
                    procedure.description
                ),
                "created_by": {
                    "id": (
                        procedure.created_by_id
                    ),
                    "username": (
                        procedure
                        .created_by
                        .username
                    ),
                },
                "created_at": (
                    procedure.created_at
                ),
            })

        return Response(data)

    if request.method == "POST":
        return create_procedure(request)


def create_procedure(request):
    title = request.data.get(
        "title",
        "",
    ).strip()

    description = request.data.get(
        "description",
        "",
    ).strip()

    steps = request.data.get("steps", [])

    if not title:
        return Response(
            {
                "title": (
                    "Title is required."
                )
            },
            status=(
                status.HTTP_400_BAD_REQUEST
            ),
        )

    if not description:
        return Response(
            {
                "description": (
                    "Description is required."
                )
            },
            status=(
                status.HTTP_400_BAD_REQUEST
            ),
        )

    if not steps:
        return Response(
            {
                "steps": (
                    "At least one step is required."
                )
            },
            status=(
                status.HTTP_400_BAD_REQUEST
            ),
        )

    validated_steps = []

    for index, step_data in enumerate(
        steps,
        start=1,
    ):
        step_description = step_data.get(
            "description",
            "",
        ).strip()

        if not step_description:
            return Response(
                {
                    "steps": (
                        f"Step {index} is empty."
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        validated_steps.append({
            "step_number": index,
            "description": step_description,
        })

    return save_procedure(
        request=request,
        title=title,
        description=description,
        steps=validated_steps,
    )


@transaction.atomic
def save_procedure(
    request,
    title,
    description,
    steps,
):
    procedure = Procedure.objects.create(
        title=title,
        description=description,
        created_by=request.user,
    )

    version = ProcedureVersion.objects.create(
        procedure=procedure,
        version_number=1.0,
        is_current=True,
    )

    created_steps = []

    for step_data in steps:
        step = ProcedureStep.objects.create(
            procedure_version=version,
            step_number=(
                step_data["step_number"]
            ),
            description=(
                step_data["description"]
            ),
        )

        created_steps.append({
            "id": step.id,
            "step_number": step.step_number,
            "description": step.description,
        })

    return Response(
        {
            "id": procedure.id,
            "title": procedure.title,
            "description": (
                procedure.description
            ),
            "created_by": {
                "id": request.user.id,
                "username": (
                    request.user.username
                ),
            },
            "version": {
                "id": version.id,
                "version_number": (
                    version.version_number
                ),
                "is_current": (
                    version.is_current
                ),
                "steps": created_steps,
            },
        },
        status=status.HTTP_201_CREATED,
    )