import { useNavigate } from "react-router-dom";
import "../../styles/ReviewItemComment.css";
import { useState } from "react";
import api from "../api/api";

const ReviewItemComment = ({ version }) => {
  const [comment, setComment] = useState("");

  const whoRewied = [
    version?.reviewed_by?.first_name,
    version?.reviewed_by?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const submitReview = async (action) => {
    try {
        const response = await api.patch(
        `/api/procedures/review/${version.id}/`,
        {
            action: action,
            review_comment: comment,
        },
        );

        console.log(response.data);
    }catch(error){
        console.error("Failed", error)
    }
  };
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

  return (
    <section>
      <div>
        <h1>Reviev decision</h1>
        {version.reviewed_by && (
          <div className="review-metadata-item">
            <span>Reviewed by</span>
            <p>{whoRewied || version.reviewed_by?.username || "—"}</p>
          </div>
        )}

        {version.reviewed_at && (
          <div className="review-metadata-item">
            <span>Reviewed at</span>
            <p>{formatDate(version.reviewed_at)}</p>
          </div>
        )}

        {version.review_comment && (
          <div className="previous-review-comment">
            <h2>Previous review comment</h2>
            <p>{version.review_comment}</p>
          </div>
        )}
        <textarea
          id="review-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Write a review comment..."
          rows={6}
        />

        <div className="review-actions">
          <button type="button" className="review-approve-button"
          onClick={() => submitReview("approve")}>
            Approve
          </button>

          <button type="button" className="review-clarification-button"
          onClick={() => submitReview("request_clarification")}>
            Request clarification
          </button>

          <button type="button" className="review-reject-button"
          onClick={() => submitReview("reject")}>
            Reject
          </button>
        </div>
      </div>
    </section>
  );
};
export default ReviewItemComment;
