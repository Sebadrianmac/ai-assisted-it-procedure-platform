import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import api from "../api/api";

import ProcedureReviewComment from "../procedure/ProcedureReviewComment";
import ProcedureEditFields from "../procedure/edit/ProcedureEditFields";
import ProcedureStepsEditor from "../procedure/edit/ProcedureStepsEditor";
import ProcedureVersionInformation from "../procedure/edit/ProcedureVersionInformation";
import SubmitVersionDialog from "../procedure/edit/SubmitVersionDialog";
import "../../styles/ProcedureEdit.css";

const EditProcedurePage = ({ permissions = [] }) => {
  const navigate = useNavigate();
  const { procedureId } = useParams();
  const [searchParams] = useSearchParams();
  const isNewRevision = searchParams.get("mode") === "new-revision";
  const [procedure, setProcedure] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState([]);
  const [status, setStatus] = useState("");
  const [statusLabel, setStatusLabel] = useState("");
  const [currentVersion, setCurrentVersion] = useState(null);
  const [activeVersion, setActiveVersion] = useState(null);
  const [isFirstVersion, setIsFirstVersion] = useState(false);
  const [changeType, setChangeType] = useState("minor");
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
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
        const editableVersion = isNewRevision
          ? loadedCurrentVersion
          : loadedActiveVersion;

        setProcedure(procedureData);
        setCurrentVersion(loadedCurrentVersion);
        setActiveVersion(loadedActiveVersion);
        setTitle(editableVersion?.title ?? procedureData.title ?? "");
        setDescription(
          editableVersion?.description ?? procedureData.description ?? "",
        );

        if (isNewRevision) {
          setStatus("in_progress");
          setStatusLabel("Draft");
        } else {
          setStatus(editableVersion?.status ?? procedureData.status ?? "");
          setStatusLabel(
            editableVersion?.status_label ?? procedureData.status_label ?? "",
          );
        }

        setSteps(
          editableVersion?.steps?.map((step) => ({
            id: step.id,
            step_number: step.step_number,
            description: step.description,
          })) ?? [],
        );

        setIsFirstVersion(loadedCurrentVersion === null);
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
  }, [procedureId, isNewRevision]);

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

      const shouldCreateRevision = isNewRevision && !activeVersion;
      const payload = {
        action,
        title: title.trim(),
        description: description.trim(),
        steps: createPayloadSteps(),
      };

      if (action === "submit_for_approval" && !isFirstVersion) {
        payload.change_type = selectedChangeType;
      }

      let response;

      if (shouldCreateRevision) {
        response = await api.post(
          `/api/procedures/${procedureId}/revisions/`,
          payload,
        );
      } else {
        response = await api.patch(
          `/api/procedures/${procedureId}/`,
          payload,
        );
      }

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
      if (shouldCreateRevision) {
      navigate(
        `/procedures/edit/${procedureId}`,
        {
          replace: true,
        },
      );
    }

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

  const openSubmitDialog = async () => {
    setError("");
    setSuccessMessage("");

    if (isFirstVersion) {
      await saveProcedure("submit_for_approval");
      return;
    }

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

        <Link to="/procedures">Back to procedures</Link>
      </section>
    );
  }

  return (
    <section className="procedure-edit">
      <form className="procedure-edit-form" onSubmit={handleSaveDraft}>
        <div className="edit-form-header">
          <div>
            <p className="edit-form-label">Procedure editor</p>

            <h1>{isNewRevision ? "Create new revision" : "Edit procedure"}</h1>
          </div>

          <span className={`current-status ` + `status-${status}`}>
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
            <ProcedureEditFields
              title={title}
              description={description}
              disabled={isFormDisabled}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
            />

            <ProcedureStepsEditor
              steps={steps}
              disabled={isFormDisabled}
              onStepChange={changeStepDescription}
              onStepAdd={addStep}
              onStepRemove={removeStep}
            />
          </div>

          <ProcedureVersionInformation
            procedure={procedure}
            currentVersion={currentVersion}
            activeVersion={activeVersion}
            statusLabel={statusLabel}
            isNewRevision={isNewRevision}
          />
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
                className="edit-save-button"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save draft"}
              </button>

              <button
                type="button"
                className="edit-submit-button"
                onClick={openSubmitDialog}
                disabled={isSaving}
              >
                Submit for approval
              </button>
            </>
          )}
        </div>
      </form>

      {!isFirstVersion && (
        <SubmitVersionDialog
          isOpen={isSubmitDialogOpen}
          changeType={changeType}
          isSaving={isSaving}
          onChangeType={setChangeType}
          onClose={() => setIsSubmitDialogOpen(false)}
          onSubmit={submitForApproval}
        />
      )}

      {procedure.active_version?.review_comment && (
        <ProcedureReviewComment version={procedure.active_version} />
      )}
    </section>
  );
};

export default EditProcedurePage;
