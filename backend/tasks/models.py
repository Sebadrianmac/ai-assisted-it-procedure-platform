from django.db import models
from users.models import User
from procedures.models import (
    ProcedureVersion,
    ProcedureStep
    )
from django.contrib.auth.models import Group


class ProcedureExecution(models.Model):
    class StatusChoices(models.TextChoices):
        CREATED = (
            "created",
            "Created"
        )
        IN_PROGRESS = (
            "in_progress",
            "In Progress"
        )
        COMPLETED = (
            "completed",
            "Completed"
        )
        CANCELLED = (
            "cancelled",
            "Cancelled"
        )
    procedure_version = models.ForeignKey(
        ProcedureVersion,
        on_delete=models.PROTECT,
        related_name="executions"
    )
    context = models.TextField(blank=True)
    started_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="started_executions"
    )
    status = models.CharField(
        max_length=30,
        choices=StatusChoices.choices,
        default=StatusChoices.CREATED,
    )
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Execution {self.id} - {self.procedure_version.title} v{self.procedure_version.version_number}"

class Task(models.Model):
    class StatusChoices(models.TextChoices):
        CREATED = (
            "created",
            "Created"
        )
        IN_PROGRESS = (
            "in_progress",
            "In Progress"
        )
        COMPLETED = (
            "completed",
            "Completed"
        )
        BLOCKED = (
            "blocked",
            "Blocked"
        )
        CANCELLED = (
            "cancelled",
            "Cancelled"
        )
    execution = models.ForeignKey(
        ProcedureExecution,
        on_delete=models.PROTECT,
        related_name="tasks"
    )
    procedure_step=models.ForeignKey(
        ProcedureStep,
        on_delete=models.PROTECT,
        related_name="generated_tasks"
    )
    result=models.TextField(blank=True)
    assigned_to=models.ForeignKey(User, 
                                  on_delete=models.SET_NULL, 
                                  null= True, blank=True, 
                                  related_name="assigned_tasks")
    assigned_role=models.ForeignKey(Group, 
                                    on_delete=models.SET_NULL, 
                                    null= True, blank=True, 
                                    related_name="assigned_tasks")
    status = models.CharField(max_length=30, 
                              choices=StatusChoices.choices, 
                              default=StatusChoices.CREATED)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    started_at=models.DateTimeField(blank=True, null=True)
    completed_at=models.DateTimeField(blank=True, null=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return (
            f"Task {self.id} — "
            f"Step {self.procedure_step.step_number} — "
            f"{self.get_status_display()}"
        )    
    class Meta:
        ordering = [
            "procedure_step__step_number",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "execution",
                    "procedure_step",
                ],
                name=(
                    "unique_task_per_step_"
                    "per_execution"
                ),
            ),
        ]
        permissions = [
            (
                "assign_task",
                "Can assign task"
            )
        ]