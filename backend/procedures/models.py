from django.db import models

from users.models import User


class StatusChoices(models.TextChoices):
    IN_PROGRESS = (
        "in_progress",
        "Draft",
    )
    CREATED = (
        "created",
        "Waiting for Approval",
    )
    COMPLETED = (
        "completed",
        "Approved",
    )
    REJECTED = (
        "rejected",
        "Rejected",
    )
    CLARIFICATION_NEEDED = (
        "clarification_needed",
        "Clarification Needed",
    )


class Procedure(models.Model):
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="created_procedures",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        current_version = self.versions.filter(
            is_current=True,
        ).first()

        if current_version:
            return current_version.title

        active_version = self.versions.filter(
            status__in=[
                StatusChoices.IN_PROGRESS,
                StatusChoices.CREATED,
                StatusChoices.CLARIFICATION_NEEDED,
            ],
        ).first()

        if active_version:
            return active_version.title

        last_version = self.versions.first()

        if last_version:
            return last_version.title

        return f"Procedure {self.id}"

    class Meta:
        permissions = [
            (
                "approve_procedure",
                "Can approve procedure",
            ),
            (
                "generate_procedure_with_ai",
                "Can generate procedure with AI",
            ),
        ]


class ProcedureVersion(models.Model):
    class ChangeType(models.TextChoices):
        MINOR = (
            "minor",
            "Minor change",
        )
        MAJOR = (
            "major",
            "Major change",
        )

    procedure = models.ForeignKey(
        Procedure,
        on_delete=models.CASCADE,
        related_name="versions",
    )

    title = models.CharField(
        max_length=100,
    )

    description = models.TextField(
        blank=True,
    )

    status = models.CharField(
        max_length=30,
        choices=StatusChoices.choices,
        default=StatusChoices.IN_PROGRESS,
    )

    change_type = models.CharField(
        max_length=10,
        choices=ChangeType.choices,
        null=True,
        blank=True,
    )

    version_major = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    version_minor = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    is_current = models.BooleanField(
        default=False,
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="created_procedure_versions",
    )

    submitted_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="reviewed_procedure_versions",
        null=True,
        blank=True,
    )

    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    review_comment = models.TextField(
        blank=True,
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
    )

    @property
    def version_number(self):
        if (
            self.version_major is None
            or self.version_minor is None
        ):
            return None

        return (
            f"{self.version_major}."
            f"{self.version_minor}"
        )

    def __str__(self):
        version = (
            f"v{self.version_number}"
            if self.version_number
            else "Draft"
        )

        return f"{self.title} — {version}"

    class Meta:
        ordering = [
            "-created_at",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "procedure",
                    "version_major",
                    "version_minor",
                ],
                condition=models.Q(
                    version_major__isnull=False,
                    version_minor__isnull=False,
                ),
                name=(
                    "unique_version_number_"
                    "per_procedure"
                ),
            ),
            models.UniqueConstraint(
                fields=["procedure"],
                condition=models.Q(
                    is_current=True,
                ),
                name=(
                    "unique_current_version_"
                    "per_procedure"
                ),
            ),
            models.UniqueConstraint(
                fields=["procedure"],
                condition=models.Q(
                    status__in=[
                        StatusChoices.IN_PROGRESS,
                        StatusChoices.CREATED,
                        StatusChoices
                        .CLARIFICATION_NEEDED,
                    ],
                ),
                name=(
                    "unique_active_revision_"
                    "per_procedure"
                ),
            ),
        ]


class ProcedureStep(models.Model):
    procedure_version = models.ForeignKey(
        ProcedureVersion,
        on_delete=models.CASCADE,
        related_name="steps",
    )

    step_number = models.PositiveIntegerField()

    description = models.TextField()

    def __str__(self):
        return (
            f"{self.procedure_version.title} — "
            f"Step {self.step_number}"
        )

    class Meta:
        ordering = [
            "step_number",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "procedure_version",
                    "step_number",
                ],
                name=(
                    "unique_step_number_"
                    "per_version"
                ),
            ),
        ]