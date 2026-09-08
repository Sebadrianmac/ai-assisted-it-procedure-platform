import { useState } from "react";
import { Sparkles, X } from "lucide-react";

import api from "../../api/api";
import StepDocumentsModal from "../../documents/StepDocumentsModal";

import "../../../styles/procedure/ProcedureStepsEditor.css";

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

  const [recommendedDocuments, setRecommendedDocuments] = useState({});

  const [recommendationStepIndex, setRecommendationStepIndex] = useState(null);
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");

  const callAiRecommend = async (index) => {
    const step = steps[index];
    const description = step.description.trim();

    if (!description) {
      setRecommendationError(
        "Describe the step before requesting recommendations",
      );

      return;
    }

    try {
      setIsRecommending(true);
      setRecommendationError("");
      setRecommendationStepIndex(index);

      // Очищаем рекомендации только текущего шага.
      setRecommendedDocuments((current) => ({
        ...current,
        [index]: [],
      }));

      const response = await api.post("/api/ai/recommend-documents/", {
        text: description,
        limit: 5,
      });

      const recommendations = response.data.recommendations ?? [];

      // Сохраняем рекомендации отдельно для текущего шага.
      setRecommendedDocuments((current) => ({
        ...current,
        [index]: recommendations,
      }));

      // Рекомендованные документы сразу добавляются к документам шага.
      const recommendedIds = recommendations.map((document) => document.id);

      const currentIds = step.document_ids ?? [];

      onStepDocumentsChange(index, [
        ...new Set([...currentIds, ...recommendedIds]),
      ]);
    } catch (error) {
      console.error("Failed to recommend documents:", error);

      setRecommendationError(
        error.response?.data?.detail || "Failed to recommend documents",
      );
    } finally {
      setIsRecommending(false);
    }
  };

  const removeRecommendedDocument = (stepIndex, documentId) => {
    const step = steps[stepIndex];

    const updatedDocumentIds = (step.document_ids ?? []).filter(
      (id) => id !== documentId,
    );

    onStepDocumentsChange(stepIndex, updatedDocumentIds);

    setRecommendedDocuments((current) => ({
      ...current,
      [stepIndex]: (current[stepIndex] ?? []).filter(
        (document) => document.id !== documentId,
      ),
    }));
  };

  return (
    <div className="procedure-steps-editor">
      <div className="steps-heading">
        <label>Procedure steps</label>

        <span>
          {steps.length} {steps.length === 1 ? "step" : "steps"}
        </span>
      </div>

      {recommendationError && (
        <p className="edit-form-error">{recommendationError}</p>
      )}

      {steps.length === 0 ? (
        <p className="empty-steps">No steps added yet.</p>
      ) : (
        <div className="edit-steps-list">
          {steps.map((step, index) => {
            const stepRecommendations = recommendedDocuments[index] ?? [];

            return (
              <div className="edit-step" key={step.id ?? `step-${index}`}>
                <span className="edit-step-number">{index + 1}</span>

                <div className="edit-step-content">
                  <textarea
                    value={step.description}
                    onChange={(event) =>
                      onStepChange(index, event.target.value)
                    }
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

                          if (documentUrl) {
                            return (
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
                            );
                          }

                          return (
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

                    {stepRecommendations.length > 0 && (
                      <div className="recommended-documents">
                        <span className="recommended-documents-label">
                          AI recommended documents
                        </span>

                        {stepRecommendations.map((document) => (
                          <div
                            className="recommended-document"
                            key={document.id}
                          >
                            <div className="recommended-document-info">
                              <span>{document.title}</span>

                              <small>
                                {Math.max(
                                  0,
                                  Math.round(document.similarity * 100),
                                )}
                                % match
                              </small>
                            </div>

                            {!disabled && (
                              <button
                                type="button"
                                className="remove-recommended-document"
                                onClick={() =>
                                  removeRecommendedDocument(index, document.id)
                                }
                                aria-label={`Remove ${document.title}`}
                                title="Remove recommendation"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="step-document-actions">
                    {!disabled && (
                      <button
                        type="button"
                        className="manage-step-documents-button"
                        onClick={() => setDocumentsStepIndex(index)}
                      >
                        Manage documents
                      </button>
                    )}

                    <button
                      type="button"
                      className="ai-recommend"
                      onClick={() => callAiRecommend(index)}
                      disabled={
                        disabled ||
                        !step.description.trim() ||
                        (isRecommending && recommendationStepIndex === index)
                      }
                    >
                      <Sparkles size={18} />

                      <span className="ai-recommend-text">
                        {isRecommending && recommendationStepIndex === index
                          ? "Searching..."
                          : "AI recommendation"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="edit-step-actions">
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
              </div>
            );
          })}
        </div>
      )}

      {!disabled && (
        <button type="button" className="add-step-button" onClick={onStepAdd}>
          + Add step
        </button>
      )}

      {documentsStepIndex !== null && (
        <StepDocumentsModal
          stepNumber={
            steps[documentsStepIndex].step_number ?? documentsStepIndex + 1
          }
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
