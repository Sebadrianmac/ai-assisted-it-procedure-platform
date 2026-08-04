import {
  useEffect,
  useRef,
  useState,
} from "react";

const ProcedureStepsForm = ({
  title,
  description,
  steps,
  setSteps,
  onBack,
  onCreate,
}) => {
  const [currentStep, setCurrentStep] =
    useState("");

  const [editingIndex, setEditingIndex] =
    useState(null);

  const inputRef = useRef(null);

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
      };

      setSteps(updatedSteps);
      setEditingIndex(null);
    } else {
      const newStep = {
        step_number: steps.length + 1,
        description: cleanedStep,
      };

      setSteps([
        ...steps,
        newStep,
      ]);
    }

    setCurrentStep("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    confirmStep();
  };

  const handleEditStep = (index) => {
    setEditingIndex(index);

    setCurrentStep(
      steps[index].description
    );
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setCurrentStep("");
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
                <span>
                  {step.description}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    handleEditStep(index)
                  }
                >
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
            ? `Edit step ${
                steps[editingIndex]
                  .step_number
              }`
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
                ? "Edit step description"
                : "Describe the next step"
            }
            onChange={(event) =>
              setCurrentStep(
                event.target.value
              )
            }
          />

          <button type="submit">
            {editingIndex !== null
              ? "Save changes"
              : "Add step"}
          </button>

          {editingIndex !== null && (
            <button
              type="button"
              onClick={handleCancelEdit}
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="steps-actions">
        <button
          type="button"
          onClick={onBack}
        >
          Back
        </button>

        <button
          type="submit"
          onClick={onCreate}
          disabled={steps.length === 0}
        >
          Create procedure
        </button>
      </div>
    </section>
  );
};

export default ProcedureStepsForm;