from .models import StatusChoices


def serialize_user(user):
    if user is None:
        return None

    return {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
    }


def serialize_step(step, request=None):
    return {
        "id": step.id,
        "step_number": step.step_number,
        "description": step.description,
        "documents": [
            serialize_document(document, request)
            for document in step.documents.all()
        ],
    }


def serialize_version(version, include_steps=False, request= None):
    if version is None:
        return None

    version_data = {
        "id": version.id,
        "title": version.title,
        "description": version.description,
        "status": version.status,
        "status_label": version.get_status_display(),
        "change_type": version.change_type,
        "version_major": version.version_major,
        "version_minor": version.version_minor,
        "version_number": version.version_number,
        "is_current": version.is_current,
        "created_by": serialize_user(version.created_by),
        "submitted_at": version.submitted_at,
        "reviewed_by": serialize_user(version.reviewed_by),
        "reviewed_at": version.reviewed_at,
        "review_comment": version.review_comment,
        "created_at": version.created_at,
        "updated_at": version.updated_at,
    }

    if include_steps:
        version_data["steps"] = [
            serialize_step(step, request)
            for step in version.steps.all()
        ]

    return version_data


def get_current_version(procedure):
    return next(
        (version for version in procedure.versions.all() if version.is_current),
        None,
    )


def get_active_version(procedure):
    active_statuses = [
        StatusChoices.IN_PROGRESS,
        StatusChoices.CREATED,
        StatusChoices.CLARIFICATION_NEEDED,
    ]

    return next(
        (
            version
            for version in procedure.versions.all()
            if version.status in active_statuses
        ),
        None,
    )


def get_display_version(procedure):
    current_version = get_current_version(procedure)

    if current_version:
        return current_version

    active_version = get_active_version(procedure)

    if active_version:
        return active_version

    versions = list(procedure.versions.all())

    return versions[0] if versions else None


def serialize_procedure_list_item(procedure):
    display_version = get_display_version(procedure)
    active_version = get_active_version(procedure)
    current_version = get_current_version(procedure)

    return {
        "id": procedure.id,
        "title": display_version.title if display_version else "",
        "description": display_version.description if display_version else "",
        "status": display_version.status if display_version else None,
        "status_label": (
            display_version.get_status_display() if display_version else None
        ),
        "version_number": display_version.version_number if display_version else None,
        "created_by": serialize_user(procedure.created_by),
        "created_at": procedure.created_at,
        "updated_at": procedure.updated_at,
        "current_version": serialize_version(current_version),
        "active_version": serialize_version(active_version),
    }


def serialize_procedure_details(procedure, request):
    current_version = get_current_version(procedure)
    active_version = get_active_version(procedure)
    display_version = active_version or current_version

    return {
        "id": procedure.id,
        "title": display_version.title if display_version else "",
        "description": display_version.description if display_version else "",
        "status": display_version.status if display_version else None,
        "status_label": (
            display_version.get_status_display() if display_version else None
        ),
        "created_by": serialize_user(procedure.created_by),
        "created_at": procedure.created_at,
        "updated_at": procedure.updated_at,
        "current_version": serialize_version(current_version, include_steps=True, request=request),
        "active_version": serialize_version(active_version, include_steps=True, request=request),
        "versions": [
            serialize_version(version, include_steps=True, request=request)
            for version in procedure.versions.all()
        ],
    }


def serialize_document(document, request=None):
    file_url = None

    if document.file:
        if request is not None:
            file_url = request.build_absolute_uri(document.file.url)
        else:
            file_url = document.file.url

    return {
        "id": document.id,
        "title": document.title,
        "document_type": document.document_type,
        "document_type_label": document.get_document_type_display(),
        "description": document.description,
        "file_url": file_url,
        "external_url": document.external_url,
        "uploaded_by": serialize_user(document.uploaded_by),
        "created_at": document.created_at,
        "updated_at": document.updated_at,
    }