import StepAssignmentItem from "./StepAssignmentItem";
import "../../styles/tasks/TaskProcedureSteps.css";
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
}) => {
  return (
    <section className="table-step-info">
      <header className="procedure-steps-header">
        <div>
          <h2>Procedure steps</h2>

          <p>Assign every step to a role or a specific user.</p>
        </div>

        <p className="assigned-steps-count">
          {assignedStepsCount} of {procedureSteps.length} assigned
          <span> (optional)</span>
        </p>
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
              onTypeChange={onTypeChange}
              onAssigneeChange={onAssigneeChange}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProcedureSteps;
