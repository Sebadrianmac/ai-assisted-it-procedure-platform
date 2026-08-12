const ProcedureVersionSteps = ({ version }) => {
  const steps = version?.steps ?? [];

  const versionLabel = version?.version_number
    ? `Version ${version.version_number}`
    : "Draft";

  return (
    <section className={"procedure-steps-card"}>
      <div className={"details-card-header"}>
        <div>
          <p className="card-label">Instructions</p>

          <h2>Procedure steps</h2>
        </div>

        <span className="version-badge">{versionLabel}</span>
      </div>

      {steps.length === 0 ? (
        <p className="empty-steps">No steps were saved in this version.</p>
      ) : (
        <ol className="procedure-steps">
          {steps.map((step, index) => (
            <li key={step.id}>
              <span className="step-number">
                {step.step_number ?? index + 1}
              </span>

              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export default ProcedureVersionSteps;
