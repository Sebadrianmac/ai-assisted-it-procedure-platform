from django.db import models
from pgvector.django import VectorField
from procedures.models import Document

class KnowledgeBaseItem(models.Model):
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name="knowledge_items",
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
            "document_id",
            "chunk_number",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "document",
                    "chunk_number",
                ],
                name="unique_chunk_per_document",
            ),
        ]