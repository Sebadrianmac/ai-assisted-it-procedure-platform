import { MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../styles/ReviewItemProcedure.css";
const ReviewItemProcedure = ({ reviewProcedure, permissions = [] }) => {
  const navigate = useNavigate();

  const {
    id,
    title,
    description,
    version_number,
    change_type,
    status_label,
    submitted_at,
    created_by,
    steps_count,
  } = reviewProcedure;

  const submittedBy =
    [created_by?.first_name, created_by?.last_name].filter(Boolean).join(" ") ||
    created_by?.username ||
    "Unknown";

  const submittedDate = submitted_at
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(submitted_at))
    : "Not submitted";

  const changeTypeLabel =
    change_type === "major" ? "Major update" : (change_type === "minor" ? "Minor update" : "Created");

  const canReview = permissions.includes("procedures.approve_procedure");
  
  const openProcedure = () => {
    navigate(`/review/${reviewProcedure.id}`);
  };
  return (
    <tr 
      className="review-table-row"
      onClick={openProcedure}
    >
      <td>
        <div className="review-procedure-information">
          <strong>{title}</strong>

          {description && <p>{description}</p>}
        </div>
      </td>

      <td>
        <span className="review-version">v{version_number}</span>
      </td>

      <td>
        <span className={`review-change-type review-change-${change_type}`}>
          {changeTypeLabel}
        </span>
      </td>

      <td>{submittedBy}</td>

      <td>{submittedDate}</td>

      <td>
        {steps_count} {steps_count === 1 ? "step" : "steps"}
      </td>

      <td>
        <span className="review-status">
          <span className="review-status-dot" />
          {status_label ?? "Waiting for approval"}
        </span>
      </td>

      <td>
        <div className="review-actions">
          {canReview && (
            <button
              type="button"
              className="review-button"
              onClick={() => navigate(`/review/${id}`)}
            >
              Review
            </button>
          )}

        </div>
      </td>
    </tr>
  );
};

export default ReviewItemProcedure;
