import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const ReviewItemProcedure = ({ permissions = [], reviewProcedure }) => {
  const navigate = useNavigate();
  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const submittedBy = [
    reviewProcedure.created_by?.first_name,
    reviewProcedure.created_by?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const openProcedure = () => {
    navigate(`/review/${reviewProcedure.id}`);
  };

  const handleRowKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProcedure();
    }
  };
  return (
    <tr
      className="review-procedure-row"
      onClick={openProcedure}
      tabIndex={0}
      onKeyDown={handleRowKeyDown}
    >
      <td>
        <div>{reviewProcedure.title}</div>
      </td>

      <td>
        <div>{reviewProcedure.version_number || "Draft"}</div>
      </td>

      <td>
        <div>{reviewProcedure.change_type || "—"}</div>
      </td>
      <td>
        <div>{reviewProcedure.steps_count ?? 0}</div>
      </td>

      <td>
        <div>{submittedBy || reviewProcedure.created_by?.username || "—"}</div>
        <div>{formatDate(reviewProcedure.submitted_at)}</div>
      </td>

      <td>
        <Link to="/review/${reviewProcedure.id}">
          <ArrowRight size={28} />
        </Link>
      </td>
    </tr>
  );
};
export default ReviewItemProcedure;
