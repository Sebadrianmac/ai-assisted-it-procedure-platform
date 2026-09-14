from django.db import migrations


def move_documents_to_sources(
    apps,
    schema_editor,
):
    KnowledgeBaseItem = apps.get_model(
        "ai",
        "KnowledgeBaseItem",
    )
    KnowledgeSource = apps.get_model(
        "ai",
        "KnowledgeSource",
    )

    document_ids = (
        KnowledgeBaseItem.objects
        .exclude(document_id=None)
        .values_list(
            "document_id",
            flat=True,
        )
        .distinct()
    )

    for document_id in document_ids:
        source, created = (
            KnowledgeSource.objects.get_or_create(
                source_type="document",
                document_id=document_id,
                defaults={
                    "is_active": True,
                },
            )
        )

        KnowledgeBaseItem.objects.filter(
            document_id=document_id,
        ).update(
            source_id=source.id,
        )


def reverse_documents_to_sources(
    apps,
    schema_editor,
):
    KnowledgeBaseItem = apps.get_model(
        "ai",
        "KnowledgeBaseItem",
    )
    KnowledgeSource = apps.get_model(
        "ai",
        "KnowledgeSource",
    )

    KnowledgeBaseItem.objects.update(
        source_id=None,
    )

    KnowledgeSource.objects.filter(
        source_type="document",
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        (
            "ai",
            "0002_knowledgesource_knowledgebaseitem_source_and_more",
        ),
    ]

    operations = [
        migrations.RunPython(
            move_documents_to_sources,
            reverse_documents_to_sources,
        ),
    ]