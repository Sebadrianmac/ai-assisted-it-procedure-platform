import { useEffect, useState, version } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom"

import api from "../api/api";
import Can from "../pages/components/Can";
import "../../styles/ProcedureEdit.css"

const EditProcedurePage = ({
    permissions,
    
}) => {
    const navigate = useNavigate();
    const { procedureId } = useParams();

    const [title, setTitle]= useState("");
    const [description, setDescription]= useState("");
    const [steps, setSteps] = useState([])
    const [status, setStatus] =useState("");
    const [statuses, setStatuses] =useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
    const controller = new AbortController();

    const loadProcedure = async () => {
        try {
        setIsLoading(true);
        setError("");

        const [procedureResponse, proceduresStatus] = await Promise.all([
            api.get(`/api/procedures/${procedureId}/`,{
            signal: controller.signal,
            }),
            api.get("/api/procedures/status/",{
                signal: controller.signal,
            }),
        ])
        const procedureData = procedureResponse.data;
        const proceduresStatuses = proceduresStatus.data
        const currentVersion = procedureData.versions?.find(
        (version) => version.is_current
        );
             
        setTitle(procedureData.title ?? "");
        setDescription(procedureData.description ?? "");
        setStatus(procedureData.status ?? "");
        setStatuses(proceduresStatuses ?? []);

        setSteps(currentVersion?.steps ?? []);

        
        } catch (error) {
        if (error.code === "ERR_CANCELED") {
            return;
        }

        const status = error.response?.status;

        if (status === 401) {
            setError("You need to log in.");
        } else if (status === 403) {
            setError(
            "You do not have permission to view this procedure."
            );
        } else if (status === 404) {
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
    }, [procedureId]);


    const handleSubmit = (event) => {
        event.preventDefault()
    }
    if (isLoading) {
        return <p>Loading procedure...</p>;
    }
    return(
    <section className="procedure-edit">
    <form
        className="procedure-edit-form"
        onSubmit={handleSubmit}
    >
        <div className="edit-form-header">
        <div>
            <p className="edit-form-label">
            Procedure editor
            </p>
            <h1>Edit procedure</h1>
        </div>
        </div>

        <div className="edit-form-group">
        <label htmlFor="title">Title</label>

        <input
            type="text"
            id="title"
            value={title}
            onChange={(event) =>
            setTitle(event.target.value)
            }
            placeholder="Enter procedure title"
            required
        />
        </div>

        <div className="edit-form-group">
        <label htmlFor="description">
            Description
        </label>

        <textarea
            id="description"
            value={description}
            onChange={(event) =>
            setDescription(event.target.value)
            }
            placeholder="Enter procedure description"
            rows="5"
        />
        </div>

        <div className="edit-form-group">
        <label htmlFor="procedure-status">
            Status
        </label>

        {permissions.includes(
            "procedures.approve_procedure"
        ) ? (
            <Can
            permission="procedures.approve_procedure"
            permissions={permissions}
            >
            <select
                id="procedure-status"
                value={status}
                onChange={(event) =>
                setStatus(event.target.value)
                }
            >
                {statuses.map((statusOption) => (
                <option
                    key={statusOption.value}
                    value={statusOption.value}
                >
                    {statusOption.label}
                </option>
                ))}
            </select>
            </Can>
        ) : (
            <span
            className={`current-status status-${status}`}
            >
            {status.replaceAll("_", " ")}
            </span>
        )}
        </div>

        <div className="edit-form-group">
        <div className="steps-heading">
            <label>Procedure steps</label>

            <span>{steps.length} steps</span>
        </div>

        {steps.length === 0 ? (
            <p className="empty-steps">
            No steps found.
            </p>
        ) : (
            <div className="edit-steps-list">
            {steps.map((step) => (
                <div
                className="edit-step"
                key={step.id}
                >
                <span className="edit-step-number">
                    {step.step_number}
                </span>

                <p>{step.description}</p>
                </div>
            ))}
            </div>
        )}
        </div>

        {error && (
        <p className="edit-form-error">
            {error}
        </p>
        )}

        <div className="edit-form-actions">
        <button
            type="button"
            className="edit-cancel-button"
            onClick={() =>
            navigate(`/procedures/${procedureId}`)
            }
        >
            Cancel
        </button>

        <button
            type="submit"
            className="edit-save-button"
        >
            Save changes
        </button>
        </div>
    </form>
    </section>
    )
}
export default EditProcedurePage