from django.contrib.auth import authenticate

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken


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