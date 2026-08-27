from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand

ROLE_PERMISSIONS = {
    "System Administrator": [
        "users.add_user",
        "users.view_user",
        "users.change_user",
        "users.delete_user",

        "auth.add_group",
        "auth.view_group",
        "auth.change_group",
        "auth.delete_group",

        "procedures.add_procedure",
        "procedures.view_procedure",
        "procedures.change_procedure",
        "procedures.delete_procedure",
        "procedures.approve_procedure",
        "procedures.generate_procedure_with_ai",

        "procedures.add_procedureversion",
        "procedures.view_procedureversion",
        "procedures.change_procedureversion",
        "procedures.delete_procedureversion",

        "procedures.add_procedurestep",
        "procedures.view_procedurestep",
        "procedures.change_procedurestep",
        "procedures.delete_procedurestep",

        "tasks.add_task",
        "tasks.view_task",
        "tasks.change_task",
        "tasks.delete_task",
        "tasks.assign_task",

        "tasks.add_procedureexecution",
        "tasks.view_procedureexecution",
        "tasks.change_procedureexecution",
        "tasks.delete_procedureexecution",

        "procedures.add_document",
        "procedures.view_document",
        "procedures.change_document",
        "procedures.delete_document",
    ],

    "IT Manager": [
        "procedures.add_procedure",
        "procedures.view_procedure",
        "procedures.change_procedure",
        "procedures.approve_procedure",
        "procedures.generate_procedure_with_ai",

        "procedures.add_procedureversion",
        "procedures.view_procedureversion",
        "procedures.change_procedureversion",

        "procedures.add_procedurestep",
        "procedures.view_procedurestep",
        "procedures.change_procedurestep",

        "tasks.add_task",
        "tasks.view_task",
        "tasks.change_task",
        "tasks.assign_task",

        "tasks.add_procedureexecution",
        "tasks.view_procedureexecution",
        "tasks.change_procedureexecution",

        "procedures.add_document",
        "procedures.view_document",
        "procedures.change_document",
        "procedures.delete_document",
    ],

    "Engineer": [
        "procedures.view_procedure",
        "procedures.view_procedureversion",
        "procedures.view_procedurestep",
        "procedures.change_procedurestep",

        "tasks.view_task",
        "tasks.change_task",
        
        "tasks.view_procedureexecution",

        "procedures.view_document",
    ],

    "Sales Representative": [
        "procedures.add_procedure",
        "procedures.view_procedure",
        "procedures.generate_procedure_with_ai",

        "tasks.add_task",
        "tasks.view_task",
        "tasks.change_task",

        "tasks.add_procedureexecution",
        "tasks.view_procedureexecution",
    ],

    "Auditor": [
        "procedures.view_procedure",
        "procedures.view_procedureversion",
        "procedures.view_procedurestep",

        "tasks.view_task",
        "tasks.view_procedureexecution",
    ],

    "Customer": [
        "procedures.view_procedure",
        "procedures.view_procedureversion",
        "procedures.view_procedurestep",

        "tasks.view_task",
        "tasks.change_task",
        "tasks.view_procedureexecution",
    ],
}

class Command(BaseCommand):
    help = (
        "Create roles and assign permissions"
    )

    def handle(self, *args, **options):
        for (
            role_name,
            permission_names,
        ) in ROLE_PERMISSIONS.items():

            role, created = (
                Group.objects.get_or_create(
                    name=role_name
                )
            )

            assigned_permissions = []
            missing_permissions = []

            for permission_name in permission_names:
                app_label, codename = permission_name.split(
                    ".",
                    maxsplit=1,
                )

                try:
                    permission = Permission.objects.get(
                        content_type__app_label=app_label,
                        codename=codename,
                    )
                    assigned_permissions.append(permission)

                except Permission.DoesNotExist:
                    missing_permissions.append(
                        permission_name
                    )

            role.permissions.set(assigned_permissions)

            if missing_permissions:
                self.stdout.write(
                    self.style.WARNING(
                        f"{role_name}: "
                        "permissions not found: "
                        f"{missing_permissions}"
                    )
                )

            action = (
                "created"
                if created
                else "updated"
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f"{role_name}: {action}, "
                    f"{len(assigned_permissions)} "
                    "permissions"
                )
            )