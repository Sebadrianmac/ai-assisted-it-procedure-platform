import StepAssignmentItem from "./StepAssignmentItem";
import "../../styles/tasks/TaskProcedureSteps.css";
import api from "../api/api";
import { useEffect, useState } from "react";

const ProcedureSteps = ({
  selectedProcedureId,
  procedureSteps,
  assignments,
  roles,
  users,
  isLoading,
  assignedStepsCount,
  onTypeChange,
  onAssigneeChange,
  onAiRoleRecommendation,
}) => {
  const [aiRecommendations, setAiRecommendations] = useState({});
  const [isRecommendingAll, setIsRecommendingAll] = useState(false);
  const [recommendingStepId, setRecommendingStepId] = useState(null);
  const [recommendationError, setRecommendationError] = useState("");
  useEffect(() => {
    setAiRecommendations({});
    setRecommendationError("");
    setIsRecommendingAll(false);
    setRecommendingStepId(null);
  }, [selectedProcedureId]);

  const clearAiRecommendation = (stepId) => {
    setAiRecommendations((currentRecommendations) => {
      const updatedRecommendations = {
        ...currentRecommendations,
      };

      delete updatedRecommendations[stepId];

      return updatedRecommendations;
    });
  };
  const handleRoleRecommend = async (selectedStep = null) => {
    const stepsToRecommend = selectedStep ? [selectedStep] : procedureSteps;

    if (
      stepsToRecommend.length === 0 ||
      isRecommendingAll ||
      recommendingStepId !== null
    ) {
      return;
    }

    try {
      setRecommendationError("");

      if (selectedStep) {
        setRecommendingStepId(selectedStep.id);
      } else {
        setIsRecommendingAll(true);
      }

      const response = await api.post("/api/ai/recommend-step-roles/", {
        steps: stepsToRecommend.map((step) => ({
          step_number: step.step_number,
          description: step.description,
        })),
      });

      const recommendations = response.data.recommendations ?? [];
      const newAiRecommendations = {};

      recommendations.forEach((recommendation) => {
        const matchingStep = procedureSteps.find(
          (step) => step.step_number === recommendation.step_number,
        );

        if (!matchingStep) {
          return;
        }
        onAiRoleRecommendation(matchingStep.id, recommendation.role_id);
        newAiRecommendations[matchingStep.id] = recommendation;
      });

      setAiRecommendations((currentRecommendations) => ({
        ...currentRecommendations,
        ...newAiRecommendations,
      }));
    } catch (error) {
      console.error("Failed to recommend roles:", error);

      setRecommendationError(
        error.response?.data?.detail || "Failed to recommend roles.",
      );
    } finally {
      setIsRecommendingAll(false);
      setRecommendingStepId(null);
    }
  };
  const handleManualTypeChange = (stepId, type) => {
    clearAiRecommendation(stepId);
    onTypeChange(stepId, type);
  };
  const handleManualAssigneeChange = (stepId, field, value) => {
    clearAiRecommendation(stepId);

    onAssigneeChange(stepId, field, value);
  };
  return (
    <section className="table-step-info">
      <header className="procedure-steps-header">
        <div>
          <h2>Procedure steps</h2>

          <p>Assign every step to a role or a specific user.</p>
        </div>
        {recommendationError && (
          <p className="role-recommendation-error">{recommendationError}</p>
        )}
        <div>
          <p className="assigned-steps-count">
            {assignedStepsCount} of {procedureSteps.length} assigned
            <span> (optional)</span>
          </p>
          <button
            type="button"
            onClick={() => handleRoleRecommend()}
            className="recommend-role-button"
            disabled={
              !selectedProcedureId ||
              isLoading ||
              procedureSteps.length === 0 ||
              isRecommendingAll ||
              recommendingStepId !== null
            }
          >
            {isRecommendingAll ? "Recommending roles..." : "Recommend roles"}
          </button>
        </div>
      </header>

      {!selectedProcedureId && (
        <div className="steps-empty">
          <p>Select a procedure to view its steps.</p>
        </div>
      )}

      {selectedProcedureId && isLoading && (
        <div className="steps-empty">
          <p>Loading procedure steps...</p>
        </div>
      )}

      {selectedProcedureId && !isLoading && procedureSteps.length === 0 && (
        <div className="steps-empty">
          <p>This procedure has no steps.</p>
        </div>
      )}

      {selectedProcedureId && !isLoading && procedureSteps.length > 0 && (
        <div className="step-assign">
          {procedureSteps.map((step) => (
            <StepAssignmentItem
              key={step.id}
              step={step}
              assignment={assignments[step.id]}
              roles={roles}
              users={users}
              aiRecommendation={aiRecommendations[step.id] ?? null}
              isRecommending={recommendingStepId === step.id}
              isRecommendationDisabled={
                isRecommendingAll || recommendingStepId !== null
              }
              onTypeChange={handleManualTypeChange}
              onAssigneeChange={handleManualAssigneeChange}
              onRecommendRole={() => handleRoleRecommend(step)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProcedureSteps;
