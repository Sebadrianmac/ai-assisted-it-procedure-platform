import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";
import "../../styles/ReviewItemComment.css";

const ReviewItemComment = ({ version }) => {
  const navigate = useNavigate();

  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reviewedBy = [
    version?.reviewed_by?.first_name,
    version?.reviewed_by?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

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

  const submitReview = async (action) => {
    const commentRequired =
      action === "request_clarification" ||
      action === "reject";

    if (commentRequired && !comment.trim()) {
      setError(
        "A review comment is required for clarification or rejection.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await api.patch(
        `/api/procedures/review/${version.id}/`,
        {
          action,
          review_comment: comment.trim(),
        },
      );

      navigate("/review");
    } catch (error) {
      const responseStatus = error.response?.status;

      if (responseStatus === 400) {
        setError(
          error.response?.data?.detail ??
            "Please check the review information.",
        );
      } else if (responseStatus === 403) {
        setError(
          "You do not have permission to review this procedure.",
        );
      } else if (responseStatus === 404) {
        setError("Procedure version was not found.");
      } else {
        setError("Failed to submit review decision.");
      }

      console.error("Failed to submit review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="review-decision-card">
      <h2>Review decision</h2>

      {version.reviewed_by && (
        <div className="review-metadata">
          <div className="review-metadata-item">
            <span>Reviewed by</span>

            <p>
              {reviewedBy ||
                version.reviewed_by?.username ||
                "—"}
            </p>
          </div>

          <div className="review-metadata-item">
            <span>Reviewed at</span>
            <p>{formatDate(version.reviewed_at)}</p>
          </div>
        </div>
      )}

      {version.review_comment && (
        <div className="previous-review-comment">
          <h3>Previous review comment</h3>
          <p>{version.review_comment}</p>
        </div>
      )}

      <label
        className="review-comment-label"
        htmlFor="review-comment"
      >
        Review comment
      </label>

      <textarea
        id="review-comment"
        value={comment}
        onChange={(event) => {
          setComment(event.target.value);

          if (error) {
            setError("");
          }
        }}
        placeholder="Enter your review comment..."
        rows={6}
        disabled={isSubmitting}
      />

      <p className="review-comment-help">
        Your feedback helps improve procedure quality.
      </p>

      {error && (
        <p className="review-submit-error">
          {error}
        </p>
      )}

      <div className="review-decision-actions">
        <button
          type="button"
          className="review-approve-button"
          disabled={isSubmitting}
          onClick={() => submitReview("approve")}
        >
          <CheckCircle2 size={19} />
          Approve
        </button>

        <button
          type="button"
          className="review-clarification-button"
          disabled={isSubmitting}
          onClick={() =>
            submitReview("request_clarification")
          }
        >
          <CircleHelp size={19} />
          Request clarification
        </button>

        <button
          type="button"
          className="review-reject-button"
          disabled={isSubmitting}
          onClick={() => submitReview("reject")}
        >
          <XCircle size={19} />
          Reject
        </button>
      </div>

      <div className="review-comment-warning">
        <AlertTriangle size={20} />

        <p>
          A review comment is required when requesting
          clarification or rejecting.
        </p>
      </div>
    </section>
  );
};

export default ReviewItemComment;