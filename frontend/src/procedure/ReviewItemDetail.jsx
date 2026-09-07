import { useEffect, useState } from "react";
import { ChevronLeft, Clock3 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/api";
import ProcedureVersionContent from "./ProcedureVersionContent";
import ReviewItemComment from "./ReviewItemComment";

import "../../styles/ReviewItemDetail.css";

const ReviewItemDetail = () => {
  const { reviewProcedureId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewVersion, setReviewVersion] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadProcedure = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api.get(
          `/api/procedures/review/${reviewProcedureId}/`,
          {
            signal: controller.signal,
          },
        );

        setReviewVersion(response.data);
      } catch (error) {
        if (
          error.code === "ERR_CANCELED" ||
          controller.signal.aborted
        ) {
          return;
        }

        const responseStatus = error.response?.status;

        if (responseStatus === 401) {
          setError("You need to log in.");
        } else if (responseStatus === 403) {
          setError(
            "You do not have permission to view this procedure.",
          );
        } else if (responseStatus === 404) {
          setError("Procedure version was not found.");
        } else {
          setError("Failed to load procedure.");
        }

        console.error("Failed to load procedure:", error);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadProcedure();

    return () => {
      controller.abort();
    };
  }, [reviewProcedureId]);

  if (isLoading) {
    return (
      <div className="review-detail-message">
        Loading procedure...
      </div>
    );
  }

  if (error) {
    return (
      <div className="review-detail-error">
        {error}
      </div>
    );
  }

  if (!reviewVersion) {
    return (
      <div className="review-detail-message">
        Procedure version not found.
      </div>
    );
  }

  return (
    <section className="review-item-page">
      <button
        type="button"
        className="review-back-button"
        onClick={() => navigate("/review")}
      >
        <ChevronLeft size={18} />
        Back to review list
      </button>

      <header className="review-item-header">
        <div>
          <p className="review-breadcrumb">
            Procedures <span>/</span> Review
          </p>

          <h1>Review procedure</h1>

          <p className="review-item-subtitle">
            Review the submitted version before approval
          </p>
        </div>

        <span className="review-waiting-status">
          <Clock3 size={17} />
          {reviewVersion.status_label ?? "Waiting for approval"}
        </span>
      </header>

      <div className="review-item-layout">
        <main className="review-item-detail">
          <ProcedureVersionContent version={reviewVersion} />
        </main>

        <aside className="review-item-comment">
          <ReviewItemComment version={reviewVersion} />
        </aside>
      </div>
    </section>
  );
};

export default ReviewItemDetail;