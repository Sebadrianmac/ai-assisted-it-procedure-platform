from rest_framework.permissions import BasePermission

class  TasksPermissions(BasePermission):
    def has_permission(self, request, view):
        if request.method == "GET":
            return request.user.has_perms([
                "tasks.view_task",
                "tasks.view_procedureexecution",
            ])
        if request.method == "POST":
            return request.user.has_perms([
                "tasks.add_task",
                "tasks.add_procedureexecution",
            ])
        return False
    
class CanChangeTaskStatus(BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm(
            "tasks.change_task"
        )


class CanAssignTask(BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm(
            "tasks.assign_task"
        )
class CanCancelExecution(BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm(
            "tasks.delete_procedureexecution"
        )
