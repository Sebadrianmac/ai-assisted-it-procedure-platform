from django.db import migrations


def populate_procedure_version_data(
    apps,
    schema_editor,
):
    ProcedureVersion = apps.get_model(
        "procedures",
        "ProcedureVersion",
    )

    versions = (
        ProcedureVersion.objects
        .select_related("procedure")
        .all()
    )

    for version in versions:
        procedure = version.procedure

        version.title = procedure.title
        version.description = procedure.description
        version.created_by_id = (
            procedure.created_by_id
        )

        version.save(
            update_fields=[
                "title",
                "description",
                "created_by",
            ]
        )


class Migration(migrations.Migration):

    dependencies = [
        (
            "procedures",
            "0008_procedureversion_created_by_and_more",
        ),
    ]

    operations = [
        migrations.RunPython(
            populate_procedure_version_data,
            reverse_code=migrations.RunPython.noop,
        ),
    ]