from django.db.models import Prefetch
from django.shortcuts import get_object_or_404

from .models import (
    Procedure,
    ProcedureStep,
    ProcedureVersion,
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

    last_minor_version = (
        numbered_versions
        .filter(
            version_major=(
                current_version.version_major
            ),
        )
        .order_by("-version_minor")
        .first()
    )

    return (
        current_version.version_major,
        last_minor_version.version_minor + 1,
    )


def replace_version_steps(
    version,
    steps,
):
    version.steps.all().delete()

    ProcedureStep.objects.bulk_create([
        ProcedureStep(
            procedure_version=version,
            step_number=step[
                "step_number"
            ],
            description=step[
                "description"
            ],
        )
        for step in steps
    ])