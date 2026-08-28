import { ExternalLink, FileText, Link2 } from "lucide-react";

const ProcedureVersionSteps = ({ version }) => {
  const steps = version?.steps ?? [];

  const versionLabel = version?.version_number
    ? `Version ${version.version_number}`
    : "Draft";

  const getDocumentUrl = (document) => {
    return document.file_url || document.external_url || null;
  };

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
          {steps.map((step, index) => {
            const documents = step.documents ?? [];

            return (
              <li key={step.id}>
                <span className={"step-number"}>
                  {step.step_number ?? index + 1}
                </span>

                <div className={"procedure-step-content"}>
                  <p className={"procedure-step-description"}>
                    {step.description}
                  </p>

                  {documents.length > 0 && (
                    <div className={"step-reference-documents"}>
                      <span className={"step-reference-label"}>
                        Reference documents
                      </span>

                      <div className={"step-reference-list"}>
                        {documents.map((document) => {
                          const url = getDocumentUrl(document);

                          const Icon = document.file_url ? FileText : Link2;

                          const content = (
                            <>
                              <Icon size={17} />

                              <span>{document.title}</span>

                              {url && <ExternalLink size={15} />}
                            </>
                          );

                          return url ? (
                            <a
                              className={"step-reference-document"}
                              key={document.id}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {content}
                            </a>
                          ) : (
                            <span
                              className={"step-reference-document"}
                              key={document.id}
                            >
                              {content}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};

export default ProcedureVersionSteps;
