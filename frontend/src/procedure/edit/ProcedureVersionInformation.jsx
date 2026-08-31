import "../../../styles/procedure/ProcedureVersionInformation.css";
const ProcedureVersionInformation = ({
  procedure,
  currentVersion,
  activeVersion,
  statusLabel,
  isNewRevision,
}) => {
  const createdBy =
    isNewRevision && !activeVersion
      ? "Not saved yet"
      : activeVersion?.created_by?.username ??
        procedure?.created_by?.username ??
        "Unknown";

  const lastUpdated =
    isNewRevision && !activeVersion
      ? "Not saved yet"
      : activeVersion?.updated_at
        ? new Date(
            activeVersion.updated_at,
          ).toLocaleString()
        : "Unknown";

  return (
    <aside className="version-information">
      <h2>Version information</h2>

      <div className="version-info-row">
        <span>
          Current approved version
        </span>

        <strong>
          {currentVersion?.version_number ??
            "None"}
        </strong>
      </div>

      <div className="version-info-row">
        <span>Proposed version</span>

        <strong>
          {activeVersion?.version_number ??
            "Not assigned"}
        </strong>
      </div>

      <div className="version-info-row">
        <span>Status</span>

        <strong>
          {statusLabel || "Unknown"}
        </strong>
      </div>

      <div className="version-info-row">
        <span>Created by</span>

        <strong>{createdBy}</strong>
      </div>

      <div className="version-info-row">
        <span>Last updated</span>

        <strong>{lastUpdated}</strong>
      </div>
    </aside>
  );
};

export default ProcedureVersionInformation;