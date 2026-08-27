from .procedure_views import (
    procedure_details,
    procedure_list,
    status_list,
    procedure_revision_create,
)
from .review_views import (
    procedure_review_list,
    procedure_review_detail
)
from .document_views import(
    document_list,
    document_delete,
)
__all__ = [
    "procedure_details",
    "procedure_list",
    "procedure_review_list",
    "procedure_review_detail",
    "status_list",
    "procedure_revision_create"
    "document_list",
    "document_delete",
]