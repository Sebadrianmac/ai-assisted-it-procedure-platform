from django.core.management.base import BaseCommand

from ai.embedding_service import (
    index_procedure_version,
)
from procedures.models import (
    ProcedureVersion,
    StatusChoices,
)


class Command(BaseCommand):
    help = (
        "Indexes current approved procedure "
        "versions in the knowledge base."
    )

    def handle(self, *args, **options):
        versions = (
            ProcedureVersion.objects
            .filter(
                status=StatusChoices.COMPLETED,
                is_current=True,
            )
            .select_related("procedure")
            .prefetch_related("steps")
        )

        total = versions.count()

        self.stdout.write(
            f"Indexing {total} procedure versions..."
        )

        successful = 0
        failed = 0

        for version in versions:
            try:
                items = index_procedure_version(
                    version
                )

                successful += 1

                self.stdout.write(
                    self.style.SUCCESS(
                        (
                            f"Indexed version "
                            f"{version.id}: "
                            f"{version.title} "
                            f"({len(items)} chunks)"
                        )
                    )
                )
            except Exception as error:
                failed += 1

                self.stderr.write(
                    self.style.ERROR(
                        (
                            f"Failed version "
                            f"{version.id}: {error}"
                        )
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                (
                    "Indexing finished. "
                    f"Successful: {successful}. "
                    f"Failed: {failed}."
                )
            )
        )