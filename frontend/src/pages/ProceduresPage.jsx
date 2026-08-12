import {useEffect, useMemo, useState,} from "react";

import "../../styles/ProcedureTable.css";
import api from "../api/api";
import ProcedureItem from "./../procedure/ProcedureItem";
import SearchInput from "./components/SearchInput";

const ProceduresPage = ({
  permissions = [],
}) => {
  const [procedures, setProcedures] =useState([]);
  const [isLoading, setIsLoading] =useState(true);
  const [error, setError] =useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [openActionsId, setOpenActionsId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadProcedures = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api.get(
          "/api/procedures/",
          {
            signal: controller.signal,
          }
        );

        setProcedures(response.data);
      } catch (error) {
 
        if (error.code === "ERR_CANCELED") {
          return;
        }

        const status =
          error.response?.status;

        if (status === 401) {
          setError(
            "You need to log in."
          );
        } else if (status === 403) {
          setError(
            "You do not have permission "
            + "to view procedures."
          );
        } else {
          setError(
            "Failed to load procedures."
          );
        }

        console.error(
          "Failed to load procedures:",
          error
        );
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
  const statusOrder = {
    published: 0,
    draft: 1,
    archived: 2,
  };
  const filteredProcedures = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const result = !query
      ? procedures
      : procedures.filter((procedure) => {
          const title = procedure.title?.toLowerCase() ?? "";
          const description =
            procedure.description?.toLowerCase() ?? "";

          return (
            title.includes(query) ||
            description.includes(query)
          );
        });

    return [...result].sort(
      (firstProcedure, secondProcedure) =>
        statusOrder[firstProcedure.status] -
        statusOrder[secondProcedure.status]
    );
  }, [searchQuery, procedures]);

  const deleteProcedure = async (procedureId) => {
  try {
    await api.delete(`/api/procedures/${procedureId}/`);

    setProcedures((currentProcedures) =>
      currentProcedures.filter(
        (procedure) => procedure.id !== procedureId
      )
    );
  } catch (error) {
    console.error("Failed to delete procedure:", error);
  }
};

  if (isLoading) {
    return (
      <p>Loading procedures...</p>
    );
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <section className="procedures-section">
    <div className="procedures-toolbar">
      <div className="procedures-header">
        <h1>Procedures</h1>
        <p>Manage IT procedures</p>
      </div>

      <div className="procedures-controls">
        <SearchInput
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Search users..."
      />

        <button
          type="button"
          className="procedure-control-button"
        >
          Filter
        </button>

        <button
          type="button"
          className="procedure-control-button"
        >
          Sort
        </button>
      </div>
    </div>
    <div className="procedures-table-container">
      {procedures.length === 0 ? (
        <p>No procedures found.</p>
      ) : (
        <table className="procedures-table">
            <colgroup>
            <col className="column-procedure" />
            <col className="column-version" />
            <col className="column-status" />
            <col className="column-created" />
            <col className="column-actions" />
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
              {filteredProcedures.map((procedure) => (
                <ProcedureItem
                  key={procedure.id}
                  procedure={procedure}
                  permissions={permissions}
                  
                  isActionsOpen={
                    openActionsId === procedure.id
                  }
                  onActionsClose={()=>{setOpenActionsId(null)}}
                  onActionsToggle={() => {
                    setOpenActionsId((currentId) =>
                      currentId === procedure.id
                        ? null
                        : procedure.id
                    );
                  }}
                  onDeleteProc={deleteProcedure}
                  />
              )
            )}
          </tbody>
        </table>
      )}
      </div>
    </section>
  );
};


export default ProceduresPage;