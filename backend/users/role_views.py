from django.contrib.auth.models import Group, Permission
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .permissions import RolePermission
from django.shortcuts import get_object_or_404


@api_view(["GET","POST"])
@permission_classes([
    IsAuthenticated,
    RolePermission,
])
def roles_list(request):
    if request.method == 'GET':
        roles = Group.objects.prefetch_related("permissions").order_by("name")

        roles_data = []

        for role in roles:
            permissions_data = []

            for permission in role.permissions.all():
                permissions_data.append({
                    "id": permission.id,
                    "name": permission.name,
                    "codename": permission.codename,
                })

            roles_data.append({
                "id": role.id,
                "name": role.name,
                "permissions": permissions_data,
            })

        return Response(roles_data)
    if request.method == "POST":
        name = request.data.get("role_name", "").strip()
        permission_ids = request.data.get("permission_ids", [])

        if not name:
            return Response(
                {
                    "error": "Role name is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Group.objects.filter(name__iexact=name).exists():
            return Response(
                {
                    "error": "Group already exists.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(permission_ids, list):
            return Response(
                {
                    "error": "permission_ids must be a list.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        permissions = Permission.objects.filter(
            id__in=permission_ids
        )

        found_permission_ids = set(
            permissions.values_list("id", flat=True)
        )

        requested_permission_ids = set(permission_ids)

        invalid_permission_ids = (
            requested_permission_ids - found_permission_ids
        )

        if invalid_permission_ids:
            return Response(
                {
                    "error": "Some permissions do not exist.",
                    "invalid_permission_ids": list(invalid_permission_ids),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        role = Group.objects.create(name=name)

        role.permissions.set(permissions)

        permissions_data = []

        for permission in role.permissions.all():
            permissions_data.append({
                "id": permission.id,
                "name": permission.name,
                "codename": permission.codename,
            })

        return Response(
            {
                "id": role.id,
                "name": role.name,
                "permissions": permissions_data,
            },
            status=status.HTTP_201_CREATED,
        )
@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([
    IsAuthenticated,
    RolePermission
])
def role_details(request, role_id):
    role = get_object_or_404(
            Group.objects.prefetch_related("permissions"),
            id=role_id,
        )
    if request.method == "GET":
        return Response({
            "id": role.id,
            "name": role.name,
            "permissions": [
                {
                    "id": permission.id,
                    "name": permission.name,
                    "codename": permission.codename,
                }
                for permission in role.permissions.all()
            ],
        })
    if request.method == "PATCH":
        new_name = request.data.get("role_name")
        permission_ids_were_sent = (
            "permission_ids" in request.data
        )
        permission_ids = request.data.get(
            "permission_ids",
            [],
        )
        if new_name is not None:
            new_name = new_name.strip()

            if not new_name:
                return Response(
                    {
                        "error": "Role name cannot be empty.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            role_with_same_name_exists = (
                Group.objects
                .filter(name__iexact=new_name)
                .exclude(id=role.id)
                .exists()
            )

            if role_with_same_name_exists:
                return Response(
                    {
                        "error": "Group already exists.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        permissions = None

        if permission_ids_were_sent:
            if not isinstance(permission_ids, list):
                return Response(
                    {
                        "error": "permission_ids must be an array.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                permission_ids = [
                    int(permission_id)
                    for permission_id in permission_ids
                ]
            except (TypeError, ValueError):
                return Response(
                    {
                        "error": (
                            "Every permission ID must be an integer."
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            requested_permission_ids = set(
                permission_ids
            )
            permissions = Permission.objects.filter(
                id__in=requested_permission_ids
            )

            found_permission_ids = set(
                permissions.values_list(
                    "id",
                    flat=True,
                )
            )

            invalid_permission_ids = (
                requested_permission_ids
                - found_permission_ids
            )

            if invalid_permission_ids:
                return Response(
                    {
                        "error": (
                            "Some permissions do not exist."
                        ),
                        "invalid_permission_ids": list(
                            invalid_permission_ids
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if new_name is not None:
            role.name = new_name
            role.save(update_fields=["name"])

        if permissions is not None:
            role.permissions.set(permissions)

        return Response(
            {
                "id": role.id,
                "name": role.name,
                "permissions": [
                    {
                        "id": permission.id,
                        "name": permission.name,
                        "codename": permission.codename,
                    }
                    for permission
                    in role.permissions.all()
                ],
            },
            status=status.HTTP_200_OK,
        )
    if request.method == "DELETE":
        if role.name == "System Administrator":
            return Response(
                {
                    "error": (
                        "System Administrator role "
                        "cannot be deleted."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        role.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT,
        )
