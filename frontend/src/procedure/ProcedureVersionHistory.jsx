const formatDate = (dateValue) => {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getVersionLabel = (version) => {
  if (version.version_number) {
    return `Version ${version.version_number}`;
  }

  return "Draft";
};

const ProcedureVersionHistory = ({
  versions = [],
  selectedVersionId,
  onVersionSelect,
}) => {
  return (
    <section className="procedure-history-card">
      <div className="version-history-header">
        <div>
          <p className="card-label">History</p>

          <h2>Version history</h2>
        </div>

        <span>
          {versions.length} {versions.length === 1 ? "revision" : "revisions"}
        </span>
      </div>

      {versions.length === 0 ? (
        <p className="empty-history">No versions found.</p>
      ) : (
        <div className={"version-history-list"}>
          {versions.map((version) => {
            const isSelected = version.id === selectedVersionId;

            return (
              <button
                type="button"
                key={version.id}
                className={`version-history-item ${
                  isSelected ? "selected" : ""
                }`}
                onClick={() => onVersionSelect(version.id)}
              >
                <div className={"version-history-main"}>
                  <div className={"version-history-title"}>
                    <strong>{getVersionLabel(version)}</strong>

                    {version.is_current && (
                      <span className={"current-version-label"}>Current</span>
                    )}
                  </div>

                  <span className={"version-history-name"}>
                    {version.title}
                  </span>

                  <time>
                    {formatDate(version.updated_at ?? version.created_at)}
                  </time>
                </div>

                <span
                  className={`procedure-status ` + `status-${version.status}`}
                >
                  {version.status_label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ProcedureVersionHistory;
