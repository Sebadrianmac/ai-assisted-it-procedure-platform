from rest_framework.permissions import (
    BasePermission,
)


class UserPermission(BasePermission):
    def has_permission(
        self,
        request,
        view,
    ):
        if request.method == "POST":
            return request.user.has_perm(
                "users.add_user"
            )

        if request.method in [
            "PUT",
            "PATCH",
        ]:
            return request.user.has_perm(
                "users.change_user"
            )

        if request.method == "GET":
            return request.user.has_perm(
                "users.view_user"
            )

        if request.method == "DELETE":
            return request.user.has_perm(
                "users.delete_user"
            )

        return False

class RolePermission(BasePermission):
    def has_permission(
            self,
            request,
            view,
        ):
        if request.method == "GET":
            return request.user.has_perm(
                "auth.view_group"
            )