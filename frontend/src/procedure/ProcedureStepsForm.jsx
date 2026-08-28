import { useEffect, useRef, useState } from "react";
import StepDocumentsModal from "../documents/StepDocumentsModal";
import "../../styles/StepDocumentsModal.css";
const ProcedureStepsForm = ({
  title,
  description,
  steps,
  setSteps,
  documents = [],
  isLoadingDocuments = false,
  documentsError = "",
  onBack,
  onCreate,
  isCreating,
}) => {
  const [currentStep, setCurrentStep] = useState("");

  const [currentDocumentIds, setCurrentDocumentIds] = useState([]);

  const [editingIndex, setEditingIndex] = useState(null);

  const inputRef = useRef(null);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const handleDocumentToggle = (documentId) => {
    setCurrentDocumentIds((currentIds) => {
      const isSelected = currentIds.includes(documentId);

      if (isSelected) {
        return currentIds.filter((id) => id !== documentId);
      }

      return [...currentIds, documentId];
    });
  };

  const confirmStep = () => {
    const cleanedStep = currentStep.trim();

    if (!cleanedStep) {
      return;
    }

    if (editingIndex !== null) {
      const updatedSteps = [...steps];

      updatedSteps[editingIndex] = {
        ...updatedSteps[editingIndex],
        description: cleanedStep,
        document_ids: [...currentDocumentIds],
      };

      setSteps(updatedSteps);
      setEditingIndex(null);
    } else {
      const newStep = {
        step_number: steps.length + 1,
        description: cleanedStep,
        document_ids: [...currentDocumentIds],
      };

      setSteps([...steps, newStep]);
    }

    setCurrentStep("");
    setCurrentDocumentIds([]);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    confirmStep();
  };

  const handleEditStep = (index) => {
    const step = steps[index];

    setEditingIndex(index);

    setCurrentStep(step.description);

    setCurrentDocumentIds(step.document_ids ? [...step.document_ids] : []);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setCurrentStep("");
    setCurrentDocumentIds([]);
  };

  useEffect(() => {
    if (editingIndex !== null) {
      inputRef.current?.focus();
    }
  }, [editingIndex]);

  return (
    <section className="steps-form">
      <header>
        <p>Adding steps for:</p>

        <h1>{title}</h1>

        <p>{description}</p>
      </header>

      <div className="steps-list">
        <h2>Steps</h2>

        {steps.length === 0 ? (
          <p>No steps added yet.</p>
        ) : (
          <ol>
            {steps.map((step, index) => (
              <li key={step.step_number}>
                <div>
                  <span>{step.description}</span>

                  {step.document_ids?.length > 0 && (
                    <div className={"step-document-list"}>
                      {step.document_ids.map((documentId) => {
                        const document = documents.find(
                          (item) => item.id === documentId,
                        );

                        return document ? (
                          <small key={documentId}>{document.title}</small>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                <button type="button" onClick={() => handleEditStep(index)}>
                  Edit
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <label htmlFor="current-step">
          {editingIndex !== null
            ? `Edit step ${steps[editingIndex].step_number}`
            : `Step ${steps.length + 1}`}
        </label>

        <div className="step-input-row">
          <input
            ref={inputRef}
            id="current-step"
            name="current-step"
            type="text"
            value={currentStep}
            autoComplete="off"
            placeholder={
              editingIndex !== null
                ? "Edit step " + "description"
                : "Describe the " + "next step"
            }
            onChange={(event) => setCurrentStep(event.target.value)}
          />
        </div>

        <div className="step-documents">
          <div className={"attached-documents-header"}>
            <h3>Attached documents</h3>

            <button type="button" onClick={() => setIsDocumentsModalOpen(true)}>
              Attach documents
            </button>
          </div>

          {currentDocumentIds.length === 0 ? (
            <p>No documents attached yet.</p>
          ) : (
            <div className={"attached-document-list"}>
              {currentDocumentIds.map((documentId) => {
                const document = documents.find(
                  (item) => item.id === documentId,
                );

                if (!document) {
                  return null;
                }

                return (
                  <div className={"attached-document"} key={document.id}>
                    <span>{document.title}</span>

                    <button
                      type="button"
                      aria-label={`Remove ${document.title}`}
                      onClick={() => handleDocumentToggle(document.id)}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="step-form-actions">
          <button type="submit">
            {editingIndex !== null ? "Save changes" : "Add step"}
          </button>

          {editingIndex !== null && (
            <button type="button" onClick={handleCancelEdit}>
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="steps-actions">
        <button type="button" onClick={onBack}>
          Back
        </button>

        <button
          type="button"
          onClick={onCreate}
          disabled={steps.length === 0 || isCreating}
        >
          {isCreating ? "Creating..." : "Create procedure"}
        </button>
      </div>
      {isDocumentsModalOpen && (
        <StepDocumentsModal
          stepNumber={
            editingIndex !== null
              ? steps[editingIndex].step_number
              : steps.length + 1
          }
          documents={documents}
          selectedDocumentIds={currentDocumentIds}
          isLoading={isLoadingDocuments}
          error={documentsError}
          onClose={() => setIsDocumentsModalOpen(false)}
          onAttach={(selectedIds) => {
            setCurrentDocumentIds(selectedIds);

            setIsDocumentsModalOpen(false);
          }}
        />
      )}
    </section>
  );
};

export default ProcedureStepsForm;
