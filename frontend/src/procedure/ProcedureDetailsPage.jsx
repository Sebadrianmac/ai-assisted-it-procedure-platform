import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import ProcedureVersionContent from "../procedure/ProcedureVersionContent";
import ProcedureVersionHistory from "../procedure/ProcedureVersionHistory";
import "../../styles/ProcedureDetails.css";
import Can from "../pages/components/Can";

const ProcedureDetailsPage = ({ permissions = [] }) => {
  const navigate = useNavigate();
  const { procedureId } = useParams();
  const [procedure, setProcedure] = useState(null);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadProcedure = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api.get(`/api/procedures/${procedureId}/`, {
          signal: controller.signal,
        });

        const procedureData = response.data;
        setProcedure(procedureData);

        const defaultVersion =
          procedureData.active_version ??
          procedureData.current_version ??
          procedureData.versions?.[0] ??
          null;

        setSelectedVersionId(defaultVersion?.id ?? null);
      } catch (error) {
        if (error.code === "ERR_CANCELED") {
          return;
        }

        const responseStatus = error.response?.status;

        if (responseStatus === 401) {
          setError("You need to log in.");
        } else if (responseStatus === 403) {
          setError("You do not have permission " + "to view this procedure.");
        } else if (responseStatus === 404) {
          setError("Procedure was not found.");
        } else {
          setError("Failed to load procedure.");
        }

        console.error("Failed to load procedure:", error);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadProcedure();
    return () => {
      controller.abort();
    };
  }, [procedureId]);

  const selectedVersion = useMemo(() => {
    if (!procedure) {
      return null;
    }

    return (
      procedure.versions?.find((version) => version.id === selectedVersionId) ??
      procedure.active_version ??
      procedure.current_version ??
      null
    );
  }, [procedure, selectedVersionId]);

  const activeVersion = procedure?.active_version ?? null;
  const selectedVersionIsActive = selectedVersion?.id === activeVersion?.id;
  const canEdit = permissions.includes("procedures.change_procedure");
  const canEditSelectedVersion =
    canEdit &&
    selectedVersionIsActive &&
    ["in_progress", "clarification_needed"].includes(selectedVersion?.status);
  const canCreateNewRevision =
    !activeVersion &&
    selectedVersion?.is_current &&
    selectedVersion?.status === "completed";
  if (isLoading) {
    return <p>Loading procedure...</p>;
  }

  if (error) {
    return (
      <section className="details-error">
        <p>{error}</p>

        <Link to="/procedures" className="page-primary-action">
          Back to procedures
        </Link>
      </section>
    );
  }

  if (!procedure) {
    return <p>Procedure not found.</p>;
  }

  return (
    <div className="procedure-details-page">
      <div className={"procedure-details-navigation"}>
        <button
          type="button"
          className="details-back-button"
          onClick={() => navigate("/procedures")}
        >
          Back to procedures
        </button>
        <Can
          permissions={permissions}
          permission="procedures.change_procedureversion"
        >
          {canEditSelectedVersion && (
            <Link
              to={`/procedures/edit/${procedure.id}`}
              className={"details-edit-button"}
            >
              Edit procedure
            </Link>
          )}
        </Can>
        <Can
          permissions={permissions}
          permission={"procedures.add_procedureversion"}
        >
          {canCreateNewRevision && (
            <Link
              to={`/procedures/edit/${procedure.id}?mode=new-revision`}
              className="details-edit-button"
            >
              Create new revision
            </Link>
          )}
        </Can>
      </div>

      <div className={"procedure-details-content"}>
        <main className={"selected-version-container"}>
          <ProcedureVersionContent
            procedure={procedure}
            version={selectedVersion}
          />
        </main>

        <aside className={"version-history-container"}>
          <ProcedureVersionHistory
            versions={procedure.versions ?? []}
            selectedVersionId={selectedVersionId}
            onVersionSelect={setSelectedVersionId}
          />
        </aside>
      </div>
    </div>
  );
};

export default ProcedureDetailsPage;
