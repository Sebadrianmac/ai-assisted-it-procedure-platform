from django.contrib.auth import authenticate
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["POST"])
def login_view(request):
    login = request.data.get("login")
    password = request.data.get("password")

    user = authenticate(
        request=request,
        username=login,
        password=password
    )

    if user is None:
        return Response(
            {"error": "Invalid login or password"},
            status=401
        )

    return Response({
        "message": "Login successful",
        "id": user.id,
        "username": user.username,
        "email": user.email
    })