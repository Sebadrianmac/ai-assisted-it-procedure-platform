from rest_framework import status
from rest_framework.response import Response

from .models import Task
from users.models import User
from django.contrib.auth.models import Group
from django.shortcuts import get_object_or_404



def validate_task_content(request_data ,task, current_user):
    is_assigned_user = (
        task.assigned_to_id == current_user.id
    )
    is_assigned_role = (
        task.assigned_role_id is not None
        and current_user.groups.filter(
            id=task.assigned_role_id
        ).exists()
    )
    if not (
        is_assigned_user
        or is_assigned_role
    ):
        return None, Response(
            {
                "detail": (
                    "This task is not assigned "
                    "to you or your role."
                ),
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    new_status = request_data.get("status")

    if new_status is None:
        return None, Response(
            {
                "status": "Status is required.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not isinstance(new_status, str):
        return None, Response(
            {
                "status": (
                    "Status must be a string."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    new_status = new_status.strip()

    if not new_status:
        return None, Response(
            {
                "status": (
                    "Status cannot be empty."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if (new_status not in Task.StatusChoices.values):
        return None, Response(
            {
                "status": (
                    "Invalid task status."
                ),
                "allowed_values": (
                    Task.StatusChoices.values
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    allowed_transitions = {
        Task.StatusChoices.CREATED: [
            Task.StatusChoices.IN_PROGRESS,
            Task.StatusChoices.CANCELLED,
        ],
        Task.StatusChoices.IN_PROGRESS: [
            Task.StatusChoices.BLOCKED,
            Task.StatusChoices.COMPLETED,
            Task.StatusChoices.CANCELLED,
        ],
        Task.StatusChoices.BLOCKED: [
            Task.StatusChoices.IN_PROGRESS,
            Task.StatusChoices.CANCELLED,
        ],
        Task.StatusChoices.COMPLETED: [],
        Task.StatusChoices.CANCELLED: [],
    }
    allowed_statuses = allowed_transitions.get(
        task.status,
        [],
    )
    if (
        new_status != task.status
        and new_status not in allowed_statuses
    ):
        return None, Response(
            {
                "status": (
                    f"Cannot change task status "
                    f"from {task.status} "
                    f"to {new_status}."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    validated_data = {
        "status": new_status,
    }

    return validated_data, None
def validate_task_assignment(request_data, task):
    if (
        "assigned_role_id" not in request_data
        and "assigned_to_id" not in request_data
    ):
        return None, Response(
            {
                "assignment": (
                    "assigned_role_id or "
                    "assigned_to_id is required."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    validated_data = {}
    if "assigned_role_id" in request_data:
        assigned_role_id = request_data.get(
            "assigned_role_id"
        )

        if assigned_role_id is None:
            assigned_role = None

        elif not isinstance(
            assigned_role_id,
            int,
        ):
            return None, Response(
                {
                    "assigned_role_id": (
                        "Role ID must be an "
                        "integer or null."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        else:
            assigned_role = get_object_or_404(
                Group,
                id=assigned_role_id,
            )

        validated_data["assigned_role"] = (
            assigned_role
        )


    if "assigned_to_id" in request_data:
        assigned_to_id = request_data.get(
            "assigned_to_id"
        )

        if assigned_to_id is None:
            assigned_to = None

        elif not isinstance(
            assigned_to_id,
            int,
        ):
            return None, Response(
                {
                    "assigned_to_id": (
                        "User ID must be an "
                        "integer or null."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        else:
            assigned_to = get_object_or_404(
                User,
                id=assigned_to_id,
                is_active=True,
            )

        validated_data["assigned_to"] = (
            assigned_to
        )

    final_user = validated_data.get(
        "assigned_to",
        task.assigned_to
        )
    final_role = validated_data.get(
            "assigned_role",
            task.assigned_role
            )
    if (
        final_user is not None
        and final_role is not None
    ):
        user_has_role = (
            final_user.groups
            .filter(id=final_role.id)
            .exists()
        )

        if not user_has_role:
            return None, Response(
                {
                    "assigned_to_id": (
                        "Selected user does not "
                        "belong to selected role."
                    ),
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )
    return validated_data, None