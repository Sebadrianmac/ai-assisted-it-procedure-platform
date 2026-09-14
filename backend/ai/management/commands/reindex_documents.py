from django.core.management.base import BaseCommand

from ai.embedding_service import index_document
from procedures.models import Document


class Command(BaseCommand):
    help = "Create embeddings for all existing documents."

    def handle(self, *args, **options):
        documents = Document.objects.all()
        documents_count = documents.count()

        if documents_count == 0:
            self.stdout.write(
                self.style.WARNING(
                    "No documents found.",
                )
            )

            return

        self.stdout.write(
            f"Indexing {documents_count} documents..."
        )

        indexed_count = 0
        failed_count = 0

        for document in documents:
            try:
                knowledge_items = index_document(document)

                indexed_count += 1

                self.stdout.write(
                    self.style.SUCCESS(
                        (
                            f"Indexed document {document.id}: "
                            f"{document.title} "
                            f"({len(knowledge_items)} chunks)"
                        )
                    )
                )
            except Exception as error:
                failed_count += 1

                self.stderr.write(
                    self.style.ERROR(
                        (
                            f"Failed document {document.id}: "
                            f"{document.title}. "
                            f"Error: {error}"
                        )
                    )
                )

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                (
                    "Indexing finished. "
                    f"Successful: {indexed_count}. "
                    f"Failed: {failed_count}."
                )
            )
        )