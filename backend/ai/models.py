from django.db import models
from pgvector.django import VectorField
from procedures.models import Document, ProcedureVersion
from django.db.models import Q

class SourceType(models.TextChoices):
    DOCUMENT = "document", "Document"
    PROCEDURE = "procedure", "Procedure"

class KnowledgeSource(models.Model):
    source_type=models.CharField(
        max_length=20,
        choices=SourceType.choices,
    )
    document = models.OneToOneField(
        Document,
        on_delete=models.CASCADE,
        null=True, 
        blank=True,
        related_name="knowledge_source",
        )
    procedure_version = models.OneToOneField(
        ProcedureVersion,
        on_delete=models.CASCADE,
        null=True, 
        blank=True,
        related_name="knowledge_source",
        )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(
                        source_type=SourceType.DOCUMENT,
                        document__isnull=False,
                        procedure_version__isnull=True,
                    )
                    |
                    Q(
                        source_type=SourceType.PROCEDURE,
                        document__isnull=True,
                        procedure_version__isnull=False,
                    )
                ),
                name="knowledge_source_matches_type",
            ),
        ]

class KnowledgeBaseItem(models.Model):
    source = models.ForeignKey(
        KnowledgeSource,
        on_delete=models.CASCADE,
        related_name="items",
    )
    content = models.TextField()
    chunk_number = models.PositiveIntegerField()
    embedding = VectorField(
        dimensions=768,
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return (
            f"{self.document.title} "
            f"- chunk {self.chunk_number}"
        )

    class Meta:
        ordering = [
            "source_id",
            "chunk_number",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "source",
                    "chunk_number",
                ],
                name="unique_chunk_per_source",
            ),
        ]