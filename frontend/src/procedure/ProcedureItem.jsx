import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

import Can from "../pages/components/Can";

import "../../styles/ProcedureMenu.css";


const formatDate = (dateValue) => {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
};


const ProcedureItem = ({
  procedure,
  permissions = [],
  isActionsOpen = false,
  isDeleting = false,
  onActionsClose,
  onActionsToggle,
  onDeleteProc,
}) => {
  const navigate = useNavigate();

  const authorName = [
    procedure.created_by?.first_name,
    procedure.created_by?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const displayedAuthor =
    authorName ||
    procedure.created_by?.username ||
    "—";

  const displayVersion =
    procedure.display_version ??
    procedure.active_version ??
    procedure.current_version ??
    null;


  const displayStatus =
    procedure.status ??
    displayVersion?.status ??
    null;

  const displayStatusLabel =
    procedure.status_label ??
    displayVersion?.status_label ??
    "Unknown";


  const displayVersionNumber =
    procedure.version_number ??
    displayVersion?.version_number ??
    null;


  const versionLabel =
    displayVersionNumber ??
    (
      displayStatus === "in_progress"
        ? "Draft"
        : "—"
    );

  const canEditCurrentState = [
    "in_progress",
    "clarification_needed",
  ].includes(displayStatus);


  const openProcedure = () => {
    navigate(
      `/procedures/${procedure.id}`
    );
  };


  const handleRowKeyDown = (event) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      openProcedure();
    }
  };


  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete "${
        procedure.title || "this procedure"
      }"?`
    );

    if (!confirmed) {
      return;
    }

    await onDeleteProc(procedure.id);
  };


  return (
    <tr
      className="procedure-row"
      onClick={openProcedure}
      tabIndex={0}
      onKeyDown={handleRowKeyDown}
    >
      <td>
        <div className="procedure-title">
          {procedure.title || "—"}
        </div>

        <div className="procedure-description">
          {procedure.description || "—"}
        </div>
      </td>


      <td>
        <span className="procedure-version">
          {versionLabel}
        </span>

        {procedure.active_version &&
          procedure.current_version && (
            <span
              className={
                "procedure-version-note"
              }
            >
              Current:{" "}
              {procedure.current_version
                .version_number ?? "—"}
            </span>
          )}
      </td>


      <td>
        <span
          className={
            `procedure-status ` +
            `status-${displayStatus ?? "unknown"}`
          }
        >
          {displayStatusLabel}
        </span>
      </td>


      <td>
        <div className="procedure-author">
          {displayedAuthor}
        </div>

        <div className="procedure-date">
          Created:{" "}
          {formatDate(
            procedure.created_at
          )}
        </div>

        <div className="procedure-date">
          Updated:{" "}
          {formatDate(
            procedure.updated_at
          )}
        </div>
      </td>


      <td
        className="actions-cell"
        onMouseLeave={onActionsClose}
        onClick={(event) => {
          event.stopPropagation();
        }}
        onKeyDown={(event) => {
          event.stopPropagation();
        }}
      >
        <button
          type="button"
          className={
            `action-menu-button ${
              isActionsOpen
                ? "active"
                : ""
            }`
          }
          onClick={onActionsToggle}
          aria-label={
            `Actions for ${
              procedure.title ||
              "procedure"
            }`
          }
          aria-expanded={isActionsOpen}
          disabled={isDeleting}
        >
          ⋮
        </button>


        {isActionsOpen && (
          <div className="actions-dropdown">
            <Can
              permission={
                "procedures.view_procedure"
              }
              permissions={permissions}
            >
              <Link
                to={
                  `/procedures/${procedure.id}`
                }
                onClick={onActionsClose}
              >
                <Eye size={18} />

                <span>View details</span>
              </Link>
            </Can>


            {canEditCurrentState && (
              <Can
                permission={
                  "procedures.change_procedure"
                }
                permissions={permissions}
              >
                <Link
                  to={
                    `/procedures/edit/${
                      procedure.id
                    }`
                  }
                  onClick={onActionsClose}
                >
                  <Pencil size={18} />

                  <span>Edit</span>
                </Link>
              </Can>
            )}


            <Can
              permission={
                "procedures.delete_procedure"
              }
              permissions={permissions}
            >
              <button
                type="button"
                className={
                  "delete-menu-action"
                }
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 size={18} />

                <span>
                  {isDeleting
                    ? "Deleting..."
                    : "Delete"}
                </span>
              </button>
            </Can>
          </div>
        )}
      </td>
    </tr>
  );
};


export default ProcedureItem;