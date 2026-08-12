import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/api";
import "../../styles/ProcedureEdit.css";

const EditProcedurePage = ({ permissions = [] }) => {
  const navigate = useNavigate();
  const { procedureId } = useParams();
  const [procedure, setProcedure] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState([]);
  const [status, setStatus] = useState("");
  const [statusLabel, setStatusLabel] = useState("");
  const [currentVersion, setCurrentVersion] = useState(null);
  const [activeVersion, setActiveVersion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [changeType, setChangeType] = useState("minor");
  const canEdit = permissions.includes("procedures.change_procedure");
  const isWaitingForApproval = status === "created";
  const isFormDisabled = !canEdit || isSaving || isWaitingForApproval;

  useEffect(() => {
    const controller = new AbortController();

    const loadProcedure = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api.get(`/api/procedures/${procedureId}/`, {
          signal: controller.signal,
        });

        const procedureData = response.data;
        const loadedCurrentVersion = procedureData.current_version ?? null;

        const loadedActiveVersion = procedureData.active_version ?? null;

        const editableVersion = loadedActiveVersion ?? loadedCurrentVersion;

        setProcedure(procedureData);
        setCurrentVersion(loadedCurrentVersion);
        setActiveVersion(loadedActiveVersion);
        setTitle(editableVersion?.title ?? procedureData.title ?? "");
        setDescription(editableVersion?.description ?? procedureData.description ?? "",);
        setStatus(editableVersion?.status ?? procedureData.status ?? "");
        setStatusLabel(editableVersion?.status_label ?? procedureData.status_label ?? "",);

        setSteps(
          editableVersion?.steps?.map((step) => ({
            id: step.id,
            step_number: step.step_number,
            description: step.description,
          })) ?? [],
        );
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
  }, [procedureId]);

  const changeStepDescription = (stepIndex, newDescription) => {
    setSteps((currentSteps) =>
      currentSteps.map((step, index) =>
        index === stepIndex
          ? {
              ...step,
              description: newDescription,
            }
          : step,
      ),
    );
  };

  const addStep = () => {
    setSteps((currentSteps) => [
      ...currentSteps,
      {
        id: `new-${Date.now()}`,
        step_number: currentSteps.length + 1,
        description: "",
      },
    ]);
  };

  const removeStep = (stepIndex) => {
    setSteps((currentSteps) =>
      currentSteps
        .filter((_, index) => index !== stepIndex)
        .map((step, index) => ({
          ...step,
          step_number: index + 1,
        })),
    );
  };

  const createPayloadSteps = () => {
    return steps.map((step) => ({
      description: step.description.trim(),
    }));
  };

  const saveProcedure = async (action, selectedChangeType = null) => {
    try {
      setIsSaving(true);
      setError("");
      setSuccessMessage("");

      const payload = {
        action,
        title: title.trim(),
        description: description.trim(),
        steps: createPayloadSteps(),
      };

      if (action === "submit_for_approval") {
        payload.change_type = selectedChangeType;
      }

      const response = await api.patch(
        `/api/procedures/${procedureId}/`,
        payload,
      );

      const updatedProcedure = response.data;
      const updatedActiveVersion = updatedProcedure.active_version ?? null;
      const updatedCurrentVersion = updatedProcedure.current_version ?? null;
      const displayVersion = updatedActiveVersion ?? updatedCurrentVersion;

      setProcedure(updatedProcedure);
      setActiveVersion(updatedActiveVersion);
      setCurrentVersion(updatedCurrentVersion);
      setTitle(displayVersion?.title ?? "");
      setDescription(displayVersion?.description ?? "");
      setStatus(displayVersion?.status ?? "");
      setStatusLabel(displayVersion?.status_label ?? "");
      setSteps(
        displayVersion?.steps?.map((step) => ({
          id: step.id,
          step_number: step.step_number,
          description: step.description,
        })) ?? [],
      );

      if (action === "save_draft") {
        setSuccessMessage("Draft saved successfully.");
      } else {
        setSuccessMessage("Procedure submitted " + "for approval.");
        setIsSubmitDialogOpen(false);
      }
    } catch (error) {
      const responseStatus = error.response?.status;

      const responseData = error.response?.data;

      if (responseStatus === 401) {
        setError("You need to log in.");
      } else if (responseStatus === 403) {
        setError("You do not have permission " + "to edit this procedure.");
      } else if (responseStatus === 400) {
        setError(
          responseData?.title ??
            responseData?.description ??
            responseData?.steps ??
            responseData?.change_type ??
            responseData?.action ??
            responseData?.detail ??
            "The submitted data is invalid.",
        );
      } else {
        setError("Failed to save procedure.");
      }

      console.error("Failed to save procedure:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async (event) => {
    event.preventDefault();

    await saveProcedure("save_draft");
  };

  const openSubmitDialog = () => {
    setError("");
    setSuccessMessage("");
    setIsSubmitDialogOpen(true);
  };

  const submitForApproval = async () => {
    await saveProcedure("submit_for_approval", changeType);
  };

  if (isLoading) {
    return <p>Loading procedure...</p>;
  }

  if (!procedure) {
    return (
      <section className="procedure-edit">
        <p className="edit-form-error">{error || "Procedure not found."}</p>
      </section>
    );
  }

  return (
    <section className="procedure-edit">
      <form className="procedure-edit-form" onSubmit={handleSaveDraft}>
        <div className="edit-form-header">
          <div>
            <p className="edit-form-label">Procedure editor</p>

            <h1>Edit procedure</h1>
          </div>

          <span className={`current-status status-${status}`}>
            {statusLabel || "Unknown"}
          </span>
        </div>

        {isWaitingForApproval && (
          <div className="edit-status-message">
            This procedure is waiting for approval and cannot be edited.
          </div>
        )}

        <div className="edit-layout">
          <div className="edit-main-content">
            <div className="edit-form-group">
              <label htmlFor="title">Title</label>

              <input
                type="text"
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={"Enter procedure title"}
                disabled={isFormDisabled}
                required
              />
            </div>

            <div className="edit-form-group">
              <label htmlFor="description">Description</label>

              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={"Enter procedure description"}
                disabled={isFormDisabled}
                rows="5"
              />
            </div>

            <div className="edit-form-group">
              <div className="steps-heading">
                <label>Procedure steps</label>

                <span>
                  {steps.length} {steps.length === 1 ? "step" : "steps"}
                </span>
              </div>

              {steps.length === 0 ? (
                <p className="empty-steps">No steps added yet.</p>
              ) : (
                <div className="edit-steps-list">
                  {steps.map((step, index) => (
                    <div className="edit-step" key={step.id}>
                      <span className={"edit-step-number"}>{index + 1}</span>

                      <textarea
                        value={step.description}
                        onChange={(event) =>
                          changeStepDescription(index, event.target.value)
                        }
                        placeholder={`Describe step ${index + 1}`}
                        disabled={isFormDisabled}
                        rows="2"
                      />

                      {!isFormDisabled && (
                        <button
                          type="button"
                          className={"remove-step-button"}
                          onClick={() => removeStep(index)}
                          aria-label={`Remove step ${index + 1}`}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!isFormDisabled && (
                <button
                  type="button"
                  className="add-step-button"
                  onClick={addStep}
                >
                  + Add step
                </button>
              )}
            </div>
          </div>

          <aside className="version-information">
            <h2>Version information</h2>

            <div className="version-info-row">
              <span>Current approved version</span>

              <strong>{currentVersion?.version_number ?? "None"}</strong>
            </div>

            <div className="version-info-row">
              <span>Proposed version</span>

              <strong>{activeVersion?.version_number ?? "Not assigned"}</strong>
            </div>

            <div className="version-info-row">
              <span>Status</span>

              <strong>{statusLabel || "Unknown"}</strong>
            </div>

            <div className="version-info-row">
              <span>Created by</span>

              <strong>
                {activeVersion?.created_by?.username ??
                  procedure?.created_by?.username ??
                  "Unknown"}
              </strong>
            </div>

            <div className="version-info-row">
              <span>Last updated</span>

              <strong>
                {activeVersion?.updated_at
                  ? new Date(activeVersion.updated_at).toLocaleString()
                  : "Unknown"}
              </strong>
            </div>
          </aside>
        </div>

        {error && <p className="edit-form-error">{error}</p>}

        {successMessage && (
          <p className="edit-form-success">{successMessage}</p>
        )}

        <div className="edit-form-actions">
          <button
            type="button"
            className="edit-cancel-button"
            onClick={() => navigate(`/procedures/${procedureId}`)}
            disabled={isSaving}
          >
            Cancel
          </button>

          {canEdit && !isWaitingForApproval && (
            <>
              <button
                type="submit"
                className={"edit-save-button"}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save draft"}
              </button>

              <button
                type="button"
                className={"edit-submit-button"}
                onClick={openSubmitDialog}
                disabled={isSaving}
              >
                Submit for approval
              </button>
            </>
          )}
        </div>
      </form>

      {isSubmitDialogOpen && (
        <div className="submit-dialog-backdrop" role="presentation">
          <section
            className="submit-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={"submit-dialog-title"}
          >
            <h2 id="submit-dialog-title">Select change type</h2>

            <p>Choose how the next version number should change.</p>

            <label className="change-type-option">
              <input
                type="radio"
                name="change-type"
                value="minor"
                checked={changeType === "minor"}
                onChange={(event) => setChangeType(event.target.value)}
              />

              <span>
                <strong>Minor change</strong>

                <small>
                  Corrections and incremental updates. For example: 1.2 → 1.3
                </small>
              </span>
            </label>

            <label className="change-type-option">
              <input
                type="radio"
                name="change-type"
                value="major"
                checked={changeType === "major"}
                onChange={(event) => setChangeType(event.target.value)}
              />

              <span>
                <strong>Major change</strong>

                <small>
                  Significant workflow or technology change. For example: 1.2 →
                  2.0
                </small>
              </span>
            </label>

            <div className={"submit-dialog-actions"}>
              <button
                type="button"
                onClick={() => setIsSubmitDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitForApproval}
                disabled={isSaving}
              >
                {isSaving ? "Submitting..." : "Submit"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
};

export default EditProcedurePage;
