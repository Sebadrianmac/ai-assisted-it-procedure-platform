from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import Group
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken
from .permissions import UserPermission

from django.db.models.deletion import (
    ProtectedError,
)
from django.shortcuts import (
    get_object_or_404,
)


User= get_user_model()

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    user = request.user

    return Response({
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "date_joined": user.date_joined,
        "email": user.email,
        "roles": list(
            user.groups.values_list(
                "name",
                flat=True,
            )
        ),
        "permissions": list(
            user.get_all_permissions()
        ),
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    login = request.data.get("login")
    password = request.data.get("password")

    if not login or not password:
        return Response(
            {
                "error": "Login and password are required"
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(
        request=request,
        username=login,
        password=password,
    )

    if user is None:
        return Response(
            {
                "error": "Invalid login or password"
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    refresh = RefreshToken.for_user(user)

    return Response({
        "message": "Login successful",
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "roles": list(
                user.groups.values_list(
                    "name",
                    flat=True,
                )
            ),
            "permissions": list(
                user.get_all_permissions()
            ),
        },
    })



def user_to_dict(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_active": user.is_active,
        "date_joined": user.date_joined,
        "roles": list(
            user.groups.values_list(
                "name",
                flat=True,
            )
        ),
    }


@api_view(["GET", "POST"])
@permission_classes([
    IsAuthenticated,
    UserPermission,
])
def users_list(request):
    if request.method == "GET":
        users = (
            User.objects
            .prefetch_related("groups")
            .order_by("-is_active")
        )

        data = []

        for user in users:
            user_data = user_to_dict(user)
            data.append(user_data)

        return Response(data)

    if request.method == "POST":
        return create_user(request)

def create_user(request):
    username = request.data.get("username", "").strip()
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")
    first_name = request.data.get("first_name", "").strip()
    last_name = request.data.get("last_name", "").strip()
    role_names = request.data.get("roles", [])

    if not username or not password:
        return Response(
            {
                "error": (
                    "Username and password "
                    "are required."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(
        username__iexact=username
    ).exists():
        return Response(
            {
                "error": "Username already exists."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if email and User.objects.filter(
        email__iexact=email
    ).exists():
        return Response(
            {
                "error": "Email already exists."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    roles = Group.objects.filter(
        name__in=role_names
    )

    found_roles = set(
        roles.values_list("name", flat=True)
    )
    requested_roles = set(role_names)
    missing_roles = requested_roles - found_roles

    if missing_roles:
        return Response(
            {
                "error": "Some roles do not exist.",
                "missing_roles": list(missing_roles),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )

    user.groups.set(roles)

    return Response(
        user_to_dict(user),
        status=status.HTTP_201_CREATED,
    )


@api_view([
    "GET",
    "PATCH",
    "DELETE",
])
@permission_classes([
    IsAuthenticated,
    UserPermission,
])
def user_details(request, user_id):
    user = get_object_or_404(
        User.objects.prefetch_related("groups"),
        id=user_id,
    )

    if request.method == "GET":
        return Response(user_to_dict(user))

    if request.method == "PATCH":
        return update_user(request, user)

    if request.method == "DELETE":
        return delete_user(request, user)

def update_user(request, user):
    if "username" in request.data:
        username = request.data["username"].strip()

        username_exists = (
            User.objects
            .filter(username__iexact=username)
            .exclude(id=user.id)
            .exists()
        )

        if username_exists:
            return Response(
                {
                    "error": "Username already exists."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.username = username

    if "email" in request.data:
        email = request.data["email"].strip()

        email_exists = (
            User.objects
            .filter(email__iexact=email)
            .exclude(id=user.id)
            .exists()
        )

        if email and email_exists:
            return Response(
                {
                    "error": "Email already exists."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.email = email

    if "first_name" in request.data:
        user.first_name = (
            request.data["first_name"].strip()
        )

    if "last_name" in request.data:
        user.last_name = (
            request.data["last_name"].strip()
        )

    if "is_active" in request.data:
        new_is_active = request.data["is_active"]

    if not isinstance(new_is_active, bool):
        return Response(
            {
                "error": (
                    "is_active must be "
                    "true or false."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if (
        user.id == request.user.id
        and not new_is_active
    ):
        return Response(
            {
                "error": (
                    "You cannot deactivate "
                    "your own account."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.is_active = new_is_active

    if "password" in request.data:
        password = request.data["password"]

        if not password:
            return Response(
                {
                    "error": "Password cannot be empty."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(password)

    if "roles" in request.data:
        role_names = request.data["roles"]

        roles = Group.objects.filter(
            name__in=role_names
        )

        found_roles = set(
            roles.values_list("name", flat=True)
        )
        missing_roles = (
            set(role_names) - found_roles
        )

        if missing_roles:
            return Response(
                {
                    "error": "Some roles do not exist.",
                    "missing_roles": list(missing_roles),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.groups.set(roles)

    user.save()

    return Response(user_to_dict(user))

def delete_user(request, user):
    if user.id == request.user.id:
        return Response(
            {
                "error": (
                    "You cannot delete "
                    "your own account."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user.delete()
    except ProtectedError:
        return Response(
            {
                "error": (
                    "This user cannot be deleted "
                    "because they created procedures."
                )
            },
            status=status.HTTP_409_CONFLICT,
        )

    return Response(
        status=status.HTTP_204_NO_CONTENT,
    )