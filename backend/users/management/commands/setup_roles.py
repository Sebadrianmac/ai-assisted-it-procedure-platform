from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand


ROLE_PERMISSIONS = {
    "System Administrator": [
        "add_procedure",
        "view_procedure",
        "change_procedure",
        "delete_procedure",
        "approve_procedure",
        "generate_procedure_with_ai",

        "add_procedureversion",
        "view_procedureversion",
        "change_procedureversion",
        "delete_procedureversion",

        "add_procedurestep",
        "view_procedurestep",
        "change_procedurestep",
        "delete_procedurestep",
    ],

    "IT Manager": [
        "add_procedure",
        "view_procedure",
        "change_procedure",
        "approve_procedure",
        "generate_procedure_with_ai",

        "add_procedureversion",
        "view_procedureversion",
        "change_procedureversion",

        "add_procedurestep",
        "view_procedurestep",
        "change_procedurestep",
    ],

    "Engineer": [
        "view_procedure",
        "view_procedureversion",
        "view_procedurestep",
        "change_procedurestep",
    ],

    "Sales Representative": [
        "add_procedure",
        "view_procedure",
        "generate_procedure_with_ai",
    ],

    "Auditor": [
        "view_procedure",
        "view_procedureversion",
        "view_procedurestep",
    ],

    "Customer": [
        "view_procedure",
        "view_procedureversion",
        "view_procedurestep",
    ],
}


class Command(BaseCommand):

    def handle(self, *args, **options):
        for role_name, permissions_codes in ROLE_PERMISSIONS.items():
            role, created = Group.objects.get_or_create(
                name=role_name
            )

            permissions = Permission.objects.filter(
                content_type__app_label="procedures",
                codename__in=permissions_codes,
            )

            role.permissions.set(permissions)

            found_codes = set(
                permissions.values_list("codename", flat=True)
            )

            missing_codes = set(permissions_codes) - found_codes

            if missing_codes:
                self.stdout.write(
                    self.style.WARNING(
                        f"{role_name}: permissions not found: "
                        f"{sorted(missing_codes)}"
                    )
                )

            action = "created" if created else "updated"

            self.stdout.write(
                self.style.SUCCESS(
                    f"{role_name}: {action}, "
                    f"{permissions.count()} permissions"
                )
            )