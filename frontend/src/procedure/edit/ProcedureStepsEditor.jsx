const ProcedureStepsEditor = ({
  steps,
  disabled,
  onStepChange,
  onStepAdd,
  onStepRemove,
}) => {
  return (
    <div className="edit-form-group">
      <div className="steps-heading">
        <label>Procedure steps</label>

        <span>
          {steps.length}{" "}
          {steps.length === 1
            ? "step"
            : "steps"}
        </span>
      </div>

      {steps.length === 0 ? (
        <p className="empty-steps">
          No steps added yet.
        </p>
      ) : (
        <div className="edit-steps-list">
          {steps.map((step, index) => (
            <div
              className="edit-step"
              key={step.id}
            >
              <span className="edit-step-number">
                {index + 1}
              </span>

              <textarea
                value={step.description}
                onChange={(event) =>
                  onStepChange(
                    index,
                    event.target.value,
                  )
                }
                placeholder={
                  `Describe step ${index + 1}`
                }
                disabled={disabled}
                rows={2}
              />

              {!disabled && (
                <button
                  type="button"
                  className="remove-step-button"
                  onClick={() =>
                    onStepRemove(index)
                  }
                  aria-label={
                    `Remove step ${index + 1}`
                  }
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!disabled && (
        <button
          type="button"
          className="add-step-button"
          onClick={onStepAdd}
        >
          + Add step
        </button>
      )}
    </div>
  );
};

export default ProcedureStepsEditor;