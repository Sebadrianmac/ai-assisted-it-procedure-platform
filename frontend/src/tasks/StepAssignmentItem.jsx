import AssignmentSelect from "./AssigmentSelect";

const StepAssignmentItem = ({
  step,
  assignment,
  roles,
  users,
  onTypeChange,
  onAssigneeChange,
}) => {
  const assignmentType = assignment?.type;

  const selectedId =
    assignmentType === "role"
      ? assignment?.assignedRoleId
      : assignment?.assignedUserId;

  const assignmentField =
    assignmentType === "role"
      ? "assignedRoleId"
      : "assignedUserId";

  return (
    <div className="step-assign-item">
      <span className="step-number">
        {step.step_number}
      </span>

      <p className="step-description">
        {step.description}
      </p>

      <div className="assignment-type-toggle">
        <button
          type="button"
          className={
            assignmentType === "role" ? "active" : ""
          }
          onClick={() => onTypeChange(step.id, "role")}
        >
          Role
        </button>

        <button
          type="button"
          className={
            assignmentType === "user" ? "active" : ""
          }
          onClick={() => onTypeChange(step.id, "user")}
        >
          User
        </button>
      </div>

      {assignmentType && (
        <AssignmentSelect
          key={`${step.id}-${assignmentType}`}
          type={assignmentType}
          roles={roles}
          users={users}
          selectedId={selectedId}
          onSelect={(value) =>
            onAssigneeChange(
              step.id,
              assignmentField,
              value,
            )
          }
        />
      )}
    </div>
  );
};

export default StepAssignmentItem;