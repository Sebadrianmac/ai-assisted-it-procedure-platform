import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import "../../styles/ProcedureDetails.css"

const ProcedureDetailsPage = ({
    permissions,
}) => {

    const { procedureId } = useParams();
    const [procedure, setProcedure] = useState(null)

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect (()=>{
    const controller = new AbortController();

    const loadProcedure = async () => {
        try{
            setIsLoading(true);
            setError("");
            
            const response = await api.get(`/api/procedures/${procedureId}/`,{
                signal: controller.signal,
            })
            setProcedure(response.data);
        }catch(error){
            if(error.code === "ERR_CANCELED"){
                return;
            }
            const status= error.response?.status
            if (status === 401) {
            setError("You need to log in.");
            } else if (status === 403) {
            setError("You do not have permission " + "to view this procedure.");
            } else if (status === 404) {
            setError("Procedure was not found.");
            } else {
            setError("Failed to load Procedure.");
            }
            console.error("Failed to load user:", error);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
        }
    }
    loadProcedure();
       return () => {
      controller.abort();
    };
  }, [procedureId]);

    
    const currentVersion = procedure?.versions?.find(
    (version) => version.is_current
    );
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
  if (isLoading) {
    return <p>Loading procedure...</p>;
  }

  if (error) {
    return (
      <section>
        <p>{error}</p>

        <Link 
        to="/procedures"
        className="page-primary-action"
        >Back to procedure</Link>
      </section>
    );
  }

  if (!procedure) {
    return <p>Procedure not found.</p>;
  }

    const authorName = [
        procedure?.created_by?.first_name,
        procedure?.created_by?.last_name,
    ]
        .filter(Boolean)
        .join(" ");

    const displayedAuthor =
        authorName ||
        procedure?.created_by?.username ||
        "—";

    return (
        <div className="procedure-details-layout">
        <section className="procedure-info-card">
            <div className="details-card-header">
            <div>
                <p className="card-label">Procedure details</p>
                <h1>{procedure.title}</h1>
            </div>

            <span
                className={`procedure-status ${procedure.status}`}
            >
                {procedure.status}
            </span>
            </div>

            <p className="procedure-details-description">
            {procedure.description || "No description"}
            </p>

            <dl className="procedure-metadata">
            <div>
                <dt>Created by</dt>
                <dd>
                    {displayedAuthor}
                </dd>
            </div>

            <div>
                <dt>Created at</dt>
                <dd>{formatDate(procedure.created_at || "—")}</dd>
            </div>

            <div>
                <dt>Last modified</dt>
                <dd>{formatDate(procedure.updated_at || "—")}</dd>
            </div>

            <div>
                <dt>Current version</dt>
                <dd>
                {currentVersion?.version_number || "—"}
                </dd>
            </div>
            </dl>
        </section>

        <section className="procedure-steps-card">
            <div className="details-card-header">
            <div>
                <p className="card-label">Instructions</p>
                <h2>Procedure steps</h2>
            </div>

            {currentVersion && (
                <span className="version-badge">
                Version {currentVersion.version_number}
                </span>
            )}
            </div>

            {!currentVersion ? (
            <p>No current version.</p>
            ) : currentVersion.steps.length === 0 ? (
            <p>No steps found.</p>
            ) : (
            <ol className="procedure-steps">
                {currentVersion.steps.map((step) => (
                <li key={step.id}>
                    <span className="step-number">
                    {step.step_number}
                    </span>

                    <p>{step.description}</p>
                </li>
                ))}
            </ol>
            )}
            
        </section>
        
        </div>
        
    );
    };
export default ProcedureDetailsPage