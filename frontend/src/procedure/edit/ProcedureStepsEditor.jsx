import { useState } from "react";
import StepDocumentsModal from "../../documents/StepDocumentsModal";
import "../../../styles/procedure/ProcedureStepsEditor.css"

const ProcedureStepsEditor = ({
  steps,
  documents = [],
  isLoadingDocuments,
  documentsError,
  disabled,
  onStepChange,
  onStepDocumentsChange,
  onStepAdd,
  onStepRemove,
}) => {
  const [documentsStepIndex, setDocumentsStepIndex] = useState(null);
  
  return (
    <div className="procedure-steps-editor">
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
              <span className="edit-step-number">{index + 1}</span>
              <div className="edit-step-content">
                <textarea
                  value={step.description}
                  onChange={(event) => onStepChange(index, event.target.value)}
                  placeholder={`Describe step ${index + 1}`}
                  disabled={disabled}
                  rows={2}
                />
                <div className="edit-step-documents">
                  <span className="edit-step-documents-label">
                    Attached documents
                  </span>

                  {isLoadingDocuments ? (
                    <p>Loading documents...</p>
                  ) : documentsError ? (
                    <p className="edit-form-error">{documentsError}</p>
                  ) : !step.document_ids?.length ? (
                    <p className="empty-step-documents">
                      No documents attached.
                    </p>
                  ) : (
                    <div className="step-reference-list">
                      {step.document_ids.map((documentId) => {
                        const document = documents.find(
                          (item) => item.id === documentId,
                        );

                        if (!document) {
                          return null;
                        }

                        const documentUrl =
                          document.file_url || document.external_url;

                        return documentUrl ? (
                          <a
                            className="step-reference-document"
                            key={document.id}
                            href={documentUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <span>{document.title}</span>
                            <small>
                              {document.document_type_label ||
                                document.document_type}
                            </small>
                          </a>
                        ) : (
                          <span
                            className="step-reference-document"
                            key={document.id}
                          >
                            <span>{document.title}</span>
                            <small>
                              {document.document_type_label ||
                                document.document_type}
                            </small>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                {!disabled && (
                  <button
                    type="button"
                    className="manage-step-documents-button"
                    onClick={() => setDocumentsStepIndex(index)}
                  >
                    Manage documents
                  </button>
                )}
              </div>
              {!disabled && (
                <button
                  type="button"
                  className="remove-step-button"
                  onClick={() => onStepRemove(index)}
                  aria-label={`Remove step ${index + 1}`}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!disabled && (
        <button type="button" className="add-step-button" onClick={onStepAdd}>
          + Add step
        </button>
      )}
      {documentsStepIndex !== null && (
        <StepDocumentsModal
          stepNumber={steps[documentsStepIndex].step_number}
          documents={documents}
          selectedDocumentIds={steps[documentsStepIndex].document_ids ?? []}
          isLoading={isLoadingDocuments}
          error={documentsError}
          onClose={() => setDocumentsStepIndex(null)}
          onAttach={(selectedIds) => {
            onStepDocumentsChange(documentsStepIndex, selectedIds);

            setDocumentsStepIndex(null);
          }}
        />
      )}
    </div>
  );
};

export default ProcedureStepsEditor;
