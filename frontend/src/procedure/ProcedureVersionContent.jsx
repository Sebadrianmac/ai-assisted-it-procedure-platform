import ProcedureVersionSteps
  from "./ProcedureVersionSteps";


const formatDate = (dateValue) => {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
};


const getUserName = (user) => {
  if (!user) {
    return "—";
  }

  const fullName = [
    user.first_name,
    user.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    fullName ||
    user.username ||
    "—"
  );
};


const ProcedureVersionContent = ({
  procedure,
  version,
}) => {
  if (!version) {
    return (
      <section
        className={
          "procedure-info-card"
        }
      >
        <p>
          No procedure version found.
        </p>
      </section>
    );
  }


  const versionLabel =
    version.version_number
      ? `Version ${version.version_number}`
      : "Draft";


  return (
    <div
      className={
        "procedure-version-content"
      }
    >
      <section
        className={
          "procedure-info-card"
        }
      >
        <div
          className={
            "details-card-header"
          }
        >
          <div>
            <p className="card-label">
              {version.is_current
                ? "Current procedure"
                : "Procedure revision"}
            </p>

            <h1>{version.title}</h1>
          </div>

          <span
            className={
              `procedure-status ` +
              `status-${version.status}`
            }
          >
            {version.status_label}
          </span>
        </div>


        <p
          className={
            "procedure-details-description"
          }
        >
          {version.description ||
            "No description"}
        </p>


        <dl
          className={
            "procedure-metadata"
          }
        >
          <div>
            <dt>Version</dt>

            <dd>{versionLabel}</dd>
          </div>

          <div>
            <dt>Change type</dt>

            <dd>
              {version.change_type
                ? (
                  version.change_type ===
                  "major"
                    ? "Major change"
                    : "Minor change"
                )
                : "—"}
            </dd>
          </div>

          <div>
            <dt>Created by</dt>

            <dd>
              {getUserName(
                version.created_by
              )}
            </dd>
          </div>

          <div>
            <dt>Created at</dt>

            <dd>
              {formatDate(
                version.created_at
              )}
            </dd>
          </div>

          <div>
            <dt>Last modified</dt>

            <dd>
              {formatDate(
                version.updated_at
              )}
            </dd>
          </div>

          <div>
            <dt>Current version</dt>

            <dd>
              {version.is_current
                ? "Yes"
                : "No"}
            </dd>
          </div>

          {version.submitted_at && (
            <div>
              <dt>Submitted at</dt>

              <dd>
                {formatDate(
                  version.submitted_at
                )}
              </dd>
            </div>
          )}

          {version.reviewed_by && (
            <div>
              <dt>Reviewed by</dt>

              <dd>
                {getUserName(
                  version.reviewed_by
                )}
              </dd>
            </div>
          )}

          {version.reviewed_at && (
            <div>
              <dt>Reviewed at</dt>

              <dd>
                {formatDate(
                  version.reviewed_at
                )}
              </dd>
            </div>
          )}

          <div>
            <dt>Procedure created</dt>

            <dd>
              {formatDate(
                procedure.created_at
              )}
            </dd>
          </div>
        </dl>


        {version.review_comment && (
          <div
            className={
              "procedure-review-comment"
            }
          >
            <h2>Review comment</h2>

            <p>
              {version.review_comment}
            </p>
          </div>
        )}
      </section>


      <ProcedureVersionSteps
        version={version}
      />
    </div>
  );
};


export default ProcedureVersionContent;