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
        if request.method == "PATCH":
            return request.user.has_perm(
                "procedures.change_procedure"
            )

        if request.method == "DELETE":
            return request.user.has_perm(
                "procedures.delete_procedure"
            )
        return False
class CanApproveProcedure(BasePermission):
    message = (
        "You do not have permission "
        "to change procedure status."
    )

    def has_permission(self, request, view):
        return request.user.has_perm(
            "procedures.approve_procedure"
        )
class CanAddProcedureVersion(BasePermission):
    message = (
        "You do not have permission "
        "to create procedure versions."
    )

    def has_permission(self, request, view):
        return request.user.has_perm(
            "procedures.add_procedureversion"
        )