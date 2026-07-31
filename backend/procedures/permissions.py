from rest_framework.permissions import BasePermission


class CanViewProcedure(BasePermission):
    message = "You do not have permission to view procedures."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False 

        return request.user.has_perm(
            "procedures.view_procedure"
        )