import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import "../../styles/ProcedureTable.css";
import api from "../api/api";
import ProcedureItem from "../procedure/ProcedureItem";
import ProcedureSearchTool from "../procedure/ProcedureSearchTool";
import AiProcedureHelper from "./AIProcedureHelper";
import "../../styles/AiHelper.css";

const ProceduresPage = ({ permissions = [] }) => {
  const navigate = useNavigate();
  const PAGE_SIZE = 8;
  const [procedures, setProcedures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [openActionsId, setOpenActionsId] = useState(null);
  const [deletingProcedureId, setDeletingProcedureId] = useState(null);

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortDate, setSortDate]=useState("updated_desc");

  const canCreateProcedure = permissions.includes("procedures.add_procedure");

  useEffect(() => {
    const controller = new AbortController();

    const loadProcedures = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api.get("/api/procedures/", {
          signal: controller.signal,
        });

        setProcedures(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        if (error.code === "ERR_CANCELED") {
          return;
        }

        const responseStatus = error.response?.status;

        if (responseStatus === 401) {
          setError("You need to log in.");
        } else if (responseStatus === 403) {
          setError("You do not have permission " + "to view procedures.");
        } else {
          setError("Failed to load procedures.");
        }

        console.error("Failed to load procedures:", error);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadProcedures();

    return () => {
      controller.abort();
    };
  }, []);

  const preparedProcedures = useMemo(() => {
    return procedures.map((procedure) => {
      const displayVersion =
        procedure.active_version ?? procedure.current_version ?? null;

      return {
        ...procedure,

        title: displayVersion?.title ?? procedure.title ?? "",
        description: displayVersion?.description ?? procedure.description ?? "",
        status: displayVersion?.status ?? procedure.status ?? null,
        status_label:
          displayVersion?.status_label ?? procedure.status_label ?? "Unknown",
        version_number:
          displayVersion?.version_number ?? procedure.version_number ?? null,

        display_version: displayVersion,
      };
    });
  }, [procedures]);
  const filteredProcedures = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return preparedProcedures
      .filter((procedure) => {
        const matchesStatus =
          statusFilter === "all" || procedure.status === statusFilter;

        const title = procedure.title?.toLowerCase() ?? "";
        const description = procedure.description?.toLowerCase() ?? "";
        const statusLabel = procedure.status_label?.toLowerCase() ?? "";
        const versionNumber =
          procedure.version_number?.toString().toLowerCase() ?? "";

        const matchesSearch =
          !query ||
          title.includes(query) ||
          description.includes(query) ||
          statusLabel.includes(query) ||
          versionNumber.includes(query);

        return matchesSearch && matchesStatus;
      })
    .sort((a, b) => {
      const direction = sortDate.endsWith("asc") ? 1 : -1;

      const field = sortDate.startsWith("created")
        ? "created_at"
        : "updated_at";

      return (
        (new Date(a[field]).getTime() - new Date(b[field]).getTime()) *
        direction
      );
    });
}, [
  preparedProcedures,
  searchQuery,
  statusFilter,
  sortDate,
]);
  const pageCount = Math.max(
    1,
    Math.ceil(filteredProcedures.length / PAGE_SIZE),
  );
  useEffect(() => setPage(1), [searchQuery, statusFilter]);
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const first = filteredProcedures.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const last = Math.min(page * PAGE_SIZE, filteredProcedures.length);

  const visibleProcedrue = filteredProcedures.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const deleteProcedure = async (procedureId) => {
    try {
      setDeleteError("");
      setDeletingProcedureId(procedureId);

      await api.delete(`/api/procedures/${procedureId}/`);

      setProcedures((currentProcedures) =>
        currentProcedures.filter((procedure) => procedure.id !== procedureId),
      );

      setOpenActionsId(null);
    } catch (error) {
      const responseStatus = error.response?.status;

      if (responseStatus === 401) {
        setDeleteError("You need to log in.");
      } else if (responseStatus === 403) {
        setDeleteError(
          "You do not have permission " + "to delete this procedure.",
        );
      } else if (responseStatus === 404) {
        setDeleteError("Procedure was not found.");
      } else {
        setDeleteError("Failed to delete procedure.");
      }

      console.error("Failed to delete procedure:", error);
    } finally {
      setDeletingProcedureId(null);
    }
  };

  if (isLoading) {
    
    return <p>Loading procedures...</p>;
  }

  if (error) {
    return <p className="procedures-error">{error}</p>;
  }

  return (
    <div className="procedures-layout">
    <section className="procedures-section">
      <div className="procedures-toolbar">
        <div className="procedures-header">
          <h1>Procedures</h1>
          <p>Manage IT procedures</p>
        </div>

        <ProcedureSearchTool
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          canCreateProcedure={canCreateProcedure}
          sortDate={sortDate}
          setSortDate={setSortDate}
        />
      </div>

      {deleteError && <p className="procedures-error">{deleteError}</p>}

      <div className={"procedures-table-container"}>
        {procedures.length === 0 ? (
          <p>No procedures found.</p>
        ) : filteredProcedures.length === 0 ? (
          <p>No procedures match your search.</p>
        ) : (
          <table className="procedures-table">
            <colgroup>
              <col className={"column-procedure"} />
              <col className={"column-version"} />
              <col className={"column-status"} />
              <col className={"column-created"} />
              <col className={"column-actions"} />
            </colgroup>

            <thead>
              <tr>
                <th>Procedure</th>
                <th>Version</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="empty-row">
                    Loading Procedure...
                  </td>
                </tr>
              ) : procedures.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-row">
                    No procedures found.
                  </td>
                </tr>
              ) : (
                visibleProcedrue.map((procedure) => (
                  <ProcedureItem
                    key={procedure.id}
                    procedure={procedure}
                    permissions={permissions}
                    isActionsOpen={openActionsId === procedure.id}
                    isDeleting={deletingProcedureId === procedure.id}
                    onActionsClose={() => {
                      setOpenActionsId(null);
                    }}
                    onActionsToggle={() => {
                      setOpenActionsId((currentId) =>
                        currentId === procedure.id ? null : procedure.id,
                      );
                    }}
                    onDeleteProc={deleteProcedure}
                  />
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      <footer className="table-footer">
        <p>
          Showing {first} - {last} of {filteredProcedures.length} procedures
        </p>
        <nav className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft />
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1)
            .slice(Math.max(0, page - 3), Math.max(3, page + 2))
            .map((number) => (
              <button
                key={number}
                className={number === page ? "active" : ""}
                onClick={() => setPage(number)}
              >
                {number}
              </button>
            ))}
          <button
            disabled={page === pageCount}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight />
          </button>
        </nav>
      </footer>
    </section>
    <aside className="ai-procedure-sidebar">
            <AiProcedureHelper />
    </aside>
    </div>
  );
};

export default ProceduresPage;
