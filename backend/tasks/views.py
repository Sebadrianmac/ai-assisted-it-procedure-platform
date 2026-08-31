from django.db import transaction
from .models import Task, ProcedureExecution
from procedures.models import ProcedureVersion, StatusChoices
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .permissions import TasksPermissions, CanAssignTask, CanChangeTaskStatus
from django.utils import timezone
from django.db.models import Prefetch
from django.shortcuts import (
    get_object_or_404,
)
from .validators import validate_task_content, validate_task_assignment

@api_view(["GET", "POST"])
@permission_classes([
    IsAuthenticated,
    TasksPermissions
    ])
@transaction.atomic
def tasks_list(request):
    if request.method == "GET":
        executions = (ProcedureExecution.objects
                     .prefetch_related(Prefetch(
                          "tasks",
                            queryset=(
                                 Task.objects.select_related(
                                      "assigned_to",
                                      "assigned_role",
                                      "procedure_step"
                                 )
                                 .prefetch_related("procedure_step__documents__uploaded_by")
                            )
                          ))
                     .select_related(
                        "procedure_version",
                        "started_by",
                    )
                    .order_by("-started_at")
        )
        data = [
        {
            "id": execution.id,
            "context": execution.context,
            "status": execution.status,
            "started_at": execution.started_at,
            "procedure_version": {
                "id": (
                    execution.procedure_version.id
                ),
                "title": (
                    execution.procedure_version.title
                ),
                "version_number": (
                    execution
                    .procedure_version
                    .version_number
                ),
            },
            "started_by": {
                "id": execution.started_by.id,
                "username": (
                    execution.started_by.username
                ),
                "first_name": (
                    execution.started_by.first_name
                ),
                "last_name": (
                    execution.started_by.last_name
                ),
            },
            "tasks": [
                {
                    "task_id": task.id,
                    "step_id": task.procedure_step_id,
                    "description": task.description,
                    "status": task.status,
                    "reference_documents":[
                         {
                            "id": document.id,
                            "title": document.title,
                            "document_type": document.document_type,
                            "document_type_label": document.get_document_type.display(),
                            "description": document.description,
                            "file_url": document.file.url if document.file else None,
                            "external_url": document.external_url

                         }
                         for document in task.procedure_step.documents.all()
                    ],
                    "assigned_to": (
                        {
                            "id": task.assigned_to.id,
                            "username": (
                                task.assigned_to.username
                            ),
                            "first_name": (
                                task.assigned_to.first_name
                            ),
                            "last_name": (
                                task.assigned_to.last_name
                            ),
                        }
                        if task.assigned_to
                        else None
                    ),
                    "assigned_role": (
                        {
                            "id": task.assigned_role.id,
                            "name": task.assigned_role.name,
                        }
                        if task.assigned_role
                        else None
            ),
                }
                for task in execution.tasks.all()
            ],
        }
        for execution in executions
    ]
        return Response(
            data,
            status=status.HTTP_200_OK,
        )

    if request.method == "POST":
        procedure_version_id = request.data.get("procedure_version_id")
        if procedure_version_id is not None:     
            procedure_version = get_object_or_404(
                ProcedureVersion, 
                id=procedure_version_id, 
                is_current= True, 
                status=StatusChoices.COMPLETED
                )
            steps = procedure_version.steps.all()
            if steps.exists():
                execution = ProcedureExecution.objects.create(
                    procedure_version=procedure_version,
                    started_by = request.user,
                    context = request.data.get("context") or ""
                    )
                for step in steps:
                    Task.objects.create(
                        execution=execution,
                        procedure_step = step,
                        description=step.description
                    )
                return Response({
                    "execution_id": execution.id,
                    "procedure_version_id": procedure_version_id,
                    "context": execution.context,
                    "execution_status": execution.status,
                    "tasks_count": execution.tasks.count(),
                    "tasks": [{
                        "task_id": task.id,
                        "step_id": task.procedure_step_id,
                        "description": task.description,
                        "status": task.status,
                    }
                    for task in execution.tasks.all()
                    ]
                },
                status=status.HTTP_201_CREATED
                )
            else: 
                return Response({
                    "steps": "Approved procedure version has no steps."
                },
                status=status.HTTP_400_BAD_REQUEST
                )
        else: 
            return Response({
                "procedure_version_id": "Procedure version ID is required"
            },
            status=status.HTTP_400_BAD_REQUEST
            )
@api_view(["PUT"])
@permission_classes([
    IsAuthenticated,
    CanChangeTaskStatus
])
@transaction.atomic
def task_detail(request, task_id):
    task = get_object_or_404(
        Task.objects.select_related(
            "execution", 
            "procedure_step",
            "assigned_to",
            "assigned_role",
            ),
        id=task_id,
        )
    validated_data, error_response =(
        validate_task_content(request.data, task, request.user)
    )    
    if error_response: 
        return error_response
    
    task.status = validated_data["status"]
    
    update_fields=[
        "status",
        "updated_at",
    ]

    if ( task.status == Task.StatusChoices.IN_PROGRESS
        and task.started_at is None):
            task.started_at = timezone.now()
            update_fields.append("started_at")
    elif (task.status
        == Task.StatusChoices.COMPLETED):
            task.completed_at = timezone.now()
            update_fields.append("completed_at")

    task.save(update_fields=update_fields)
    execution = task.execution

    has_unfinished_tasks = (execution.tasks.exclude
            (
            status=Task.StatusChoices.COMPLETED
        )
        .exists()
    )
    if not has_unfinished_tasks:
        execution.status = (
            ProcedureExecution
            .StatusChoices.COMPLETED
        )
        execution.completed_at = timezone.now()

        execution.save(
            update_fields=[
                "status",
                "completed_at",
            ]
        )

    elif (
        execution.status
        == ProcedureExecution.StatusChoices.CREATED
        and task.status
        == Task.StatusChoices.IN_PROGRESS
    ):
        execution.status = (
            ProcedureExecution
            .StatusChoices.IN_PROGRESS
        )

        execution.save(
            update_fields=[
                "status",
            ]
        )
            
    return Response(
        {
            "id": task.id,
            "status": task.status,
            "status_label": (
                task.get_status_display()
            ),
            "assigned_to": (
                {
                    "id": task.assigned_to.id,
                    "username": (
                        task.assigned_to.username
                    ),
                    "first_name": (
                        task.assigned_to.first_name
                    ),
                    "last_name": (
                        task.assigned_to.last_name
                    ),
                }
                if task.assigned_to
                else None
            ),
            "assigned_role": (
                {
                    "id": task.assigned_role.id,
                    "name": task.assigned_role.name,
                }
                if task.assigned_role
                else None
            ),
            "started_at": task.started_at,
            "completed_at": task.completed_at,
            "updated_at": task.updated_at,
        },
        status=status.HTTP_200_OK,
    )
@api_view(["PUT"])
@permission_classes([
     IsAuthenticated,
     CanAssignTask
])
@transaction.atomic
def task_assignment(request, task_id):
    task = get_object_or_404(
        Task.objects.select_related(
            "execution", 
            "procedure_step",
            "assigned_to",
            "assigned_role"
            ),
        id=task_id,
        )
    validated_data, error_response =(
        validate_task_assignment(request.data, task)
    )    
    if error_response: 
        return error_response
    update_fields=[
        "updated_at",
    ]
    if "assigned_role" in validated_data:
         task.assigned_role = validated_data["assigned_role"]
         update_fields.append("assigned_role")
    if "assigned_to" in validated_data:
         task.assigned_to = validated_data["assigned_to"]
         update_fields.append("assigned_to")
    task.save(update_fields=update_fields)

    return Response(
    {
        "id": task.id,
        "assigned_to": (
            {
                "id": task.assigned_to.id,
                "username": task.assigned_to.username,
                "first_name": task.assigned_to.first_name,
                "last_name": task.assigned_to.last_name,
            }
            if task.assigned_to
            else None
        ),
        "assigned_role": (
            {
                "id": task.assigned_role.id,
                "name": task.assigned_role.name,
            }
            if task.assigned_role
            else None
        ),
        "updated_at": task.updated_at,
    },
    status=status.HTTP_200_OK,
)
