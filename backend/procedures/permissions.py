from rest_framework.permissions import BasePermission
class ProcedurePermission(BasePermission):

    def has_permission(self, request, view):
        if request.method == "GET":
            return request.user.has_perm(
                "procedures.view_procedure"
            )

        if request.method == "POST":
            return request.user.has_perm(
                "procedures.add_procedure"
            )

        return False