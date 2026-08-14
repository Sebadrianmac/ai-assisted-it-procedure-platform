import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import ProcedureVersionContent from "./ProcedureVersionContent";
import ProcedureVersionHistory from "./ProcedureVersionHistory";
import ReviewItemComment from "./ReviewItemComment";
import "../../styles/ReviewItemPage.css" 

const ReviewItemDetail = () => {
  const { reviewProcedureId } = useParams();
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
          `/api/procedures/review/${reviewProcedureId}`,
          {
            signal: controller.signal,
          },
        );

        const procedureData = response.data;
        setReviewVersion(procedureData);
      } catch (error) {
        if (error.code === "ERR_CANCELED") {
          return;
        }

        const responseStatus = error.response?.status;

        if (responseStatus === 401) {
          setError("You need to log in.");
        } else if (responseStatus === 403) {
          setError("You do not have permission " + "to view this procedure.");
        } else if (responseStatus === 404) {
          setError("Procedure was not found.");
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
    return <p>Loading procedure...</p>;
    }

    if (error) {
    return <p>{error}</p>;
    }

    if (!reviewVersion) {
    return <p>Procedure version not found.</p>;
    }
  return (
    <div className="review-item-page">
      <main className="rieview-item-detail">
        <ProcedureVersionContent
        version={reviewVersion}
        />
      </main>
      <aside className="review-item-comment">
        <ReviewItemComment 
            version={reviewVersion}
        />
      </aside>
    </div>
  );
};
export default ReviewItemDetail;
