import StepAssignmentItem from "./StepAssignmentItem";
import "../../styles/tasks/TaskProcedureSteps.css";
import api from "../api/api";
import { useState } from "react";
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
  const handleRoleRecommend = async (selectedStep = null) => {
    const stepsToRecommend = selectedStep ? [selectedStep] : procedureSteps;

    if (stepsToRecommend.length === 0) {
      return;
    }

    try {
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
    }
  };
  return (
    <section className="table-step-info">
      <header className="procedure-steps-header">
        <div>
          <h2>Procedure steps</h2>

          <p>Assign every step to a role or a specific user.</p>
        </div>
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
              !selectedProcedureId || isLoading || procedureSteps.length === 0
            }
          >
            Recommend roles
          </button>{" "}
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
              onTypeChange={onTypeChange}
              onAssigneeChange={onAssigneeChange}
              onRecommendRole={() => handleRoleRecommend(step)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProcedureSteps;
