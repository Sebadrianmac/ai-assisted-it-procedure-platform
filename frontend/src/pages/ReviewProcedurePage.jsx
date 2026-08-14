import { useEffect, useState } from "react";
import api from "../api/api";
import ReviewItemProcedure from "../procedure/ReviewItemProcedure";


const ReviewProcedurePage = (permissions = []) => {
  const [reviewProcedures, setReviewProcedures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const loadProcedure = async () => {
      try {
        const response = await api.get("/api/procedures/review/", {
          signal: controller.signal,
        });
        setReviewProcedures(response.data);
      } catch (error) {
        if (error.code === "ERR_CANCELED") {
          return;
        }

        const responseStatus = error.response?.status;

        if (responseStatus === 401) {
          setError("You need to log in.");
        } else if (responseStatus === 403) {
          setError("You do not have permission " + "to view procedures.");
        } else {
          setError("Failed to load procedures.");
        }

        console.error("Failed to load procedures:", error);
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
    }, []);

    
  if (isLoading) {
    return <p>Loading procedures...</p>;
  }

  if (error) {
    return <p >{error}</p>;
  }

  return (
    <div>
      <h1>Waiting for Approval</h1>
      <table>
        <thead>
          <tr>
            <th>Procedrure</th>
            <th>Version</th>
            <th>Change type</th> 
            <th>Steps</th>
            <th>Submitted</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
        {reviewProcedures.map((reviewProcedure)=>(
            <ReviewItemProcedure
                key={reviewProcedure.id}
                permissions={permissions}
                reviewProcedure={reviewProcedure}
            />
        ))}
        </tbody>
        </table>
    </div>
  );
};
export default ReviewProcedurePage;
