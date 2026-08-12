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

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(new Date(dateValue));
};


const ProcedureItem = ({
  procedure,
  permissions = [],
  isActionsOpen,
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

  const openProcedure = () => {
    navigate(
      `/procedures/${procedure.id}`
    );
  };

  return (
    <tr
      className="procedure-row"
      onClick={openProcedure}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          openProcedure();
        }
      }}
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
        {procedure.current_version
          ?.version_number || "—"}
      </td>

      <td>
        <span
          className={
            `procedure-status ${
              procedure.status
            }`
          }
        >
          {procedure.status || "—"}
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
            `Actions for ${procedure.title}`
          }
          aria-expanded={isActionsOpen}
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
                  `/procedures/${
                    procedure.id
                  }`
                }
              >
                <Eye size={18} />
                <span>View details</span>
              </Link>
            </Can>

            <Can
              permission={
                "procedures.change_procedure"
              }
              permissions={permissions}
            >
              <Link
                to={
                  `/procedures/edit/${procedure.id}`
                }
              >
                <Pencil size={18} />
                <span>Edit</span>
              </Link>
            </Can>

            <Can
              permission={
                "procedures.delete_procedure"
              }
              permissions={permissions}
            >
              <button
                type="button"
                className="delete-menu-action"
                onClick={() => {
                  onDeleteProc(
                    procedure.id
                  );
                }}
              >
                <Trash2 size={18} />
                <span>Delete</span>
              </button>
            </Can>
          </div>
        )}
      </td>
    </tr>
  );
};


export default ProcedureItem;