from django.contrib.auth.models import (
    Group,
)

from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import (
    IsAuthenticated,
)
from rest_framework.response import (
    Response,
)

from .permissions import RolePermission


@api_view(["GET"])
@permission_classes([
    IsAuthenticated,
    RolePermission,
])
def roles_list(request):
    roles = (
        Group.objects
        .order_by("name")
        .values(
            "id",
            "name",
        )
    )

    return Response(
        list(roles)
    )