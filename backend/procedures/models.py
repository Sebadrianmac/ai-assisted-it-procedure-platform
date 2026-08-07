from django.db import models
from users.models import User

class Procedure(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()


    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="created_procedures",
    )
    created_at = models.DateField(auto_now_add=True)
    updated_at = models.DateField(auto_now=True)

    def __str__(self):
        return self.title
    
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
    procedure=models.ForeignKey(
        Procedure, 
        on_delete=models.CASCADE, 
        related_name="versions",
        )
    version_number = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        default=1.0
    )
    is_current=models.BooleanField(default=False)
    created_at=models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.procedure.title} — v{self.version_number}"


class ProcedureStep(models.Model):
    procedure_version=models.ForeignKey(
        ProcedureVersion, 
        on_delete=models.CASCADE,
        related_name="steps"
        )
    
    step_number=models.PositiveIntegerField()
    description=models.TextField()
    def __str__(self):
        return (
            f"{self.procedure_version.procedure.title} — "
            f"Step {self.step_number}"
        )
    class Meta:
        ordering = ["step_number"]

        constraints = [
            models.UniqueConstraint(
                fields=["procedure_version", "step_number"],
                name="unique_step_number_per_version",
            )
        ]