import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import "../../styles/ProcedureTable.css";
import api from "../api/api";
import ProcedureItem from "../procedure/ProcedureItem";
import SearchInput from "./components/SearchInput";


const STATUS_ORDER = {
  in_progress: 0,
  clarification_needed: 1,
  created: 2,
  completed: 3,
  rejected: 4,
};


const ProceduresPage = ({
  permissions = [],
}) => {
  const navigate = useNavigate();

  const [procedures, setProcedures] =
    useState([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] =
    useState("");
  const [deleteError, setDeleteError] =
    useState("");
  const [searchQuery, setSearchQuery] =
    useState("");
  const [openActionsId, setOpenActionsId] =
    useState(null);
  const [deletingProcedureId, setDeletingProcedureId] =
    useState(null);


  const canCreateProcedure =
    permissions.includes(
      "procedures.add_procedure"
    );


  useEffect(() => {
    const controller =
      new AbortController();

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

        setProcedures(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (error) {
        if (
          error.code === "ERR_CANCELED"
        ) {
          return;
        }

        const responseStatus =
          error.response?.status;

        if (responseStatus === 401) {
          setError(
            "You need to log in."
          );
        } else if (
          responseStatus === 403
        ) {
          setError(
            "You do not have permission " +
            "to view procedures."
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
        if (
          !controller.signal.aborted
        ) {
          setIsLoading(false);
        }
      }
    };

    loadProcedures();

    return () => {
      controller.abort();
    };
  }, []);


  const preparedProcedures =
    useMemo(() => {
      return procedures.map(
        (procedure) => {
          const displayVersion =
            procedure.active_version ??
            procedure.current_version ??
            null;

          return {
            ...procedure,

            title:
              displayVersion?.title ??
              procedure.title ??
              "",

            description:
              displayVersion?.description ??
              procedure.description ??
              "",

            status:
              displayVersion?.status ??
              procedure.status ??
              null,

            status_label:
              displayVersion?.status_label ??
              procedure.status_label ??
              "Unknown",

            version_number:
              displayVersion
                ?.version_number ??
              procedure.version_number ??
              null,

            display_version:
              displayVersion,
          };
        }
      );
    }, [procedures]);


  const filteredProcedures =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      const result = !query
        ? preparedProcedures
        : preparedProcedures.filter(
            (procedure) => {
              const title =
                procedure.title
                  ?.toLowerCase() ?? "";

              const description =
                procedure.description
                  ?.toLowerCase() ?? "";

              const statusLabel =
                procedure.status_label
                  ?.toLowerCase() ?? "";

              const versionNumber =
                procedure.version_number
                  ?.toString()
                  .toLowerCase() ?? "";

              return (
                title.includes(query) ||
                description.includes(query) ||
                statusLabel.includes(query) ||
                versionNumber.includes(query)
              );
            }
          );

      return [...result].sort(
        (
          firstProcedure,
          secondProcedure
        ) => {
          const firstStatusOrder =
            STATUS_ORDER[
              firstProcedure.status
            ] ?? 999;

          const secondStatusOrder =
            STATUS_ORDER[
              secondProcedure.status
            ] ?? 999;

          if (
            firstStatusOrder !==
            secondStatusOrder
          ) {
            return (
              firstStatusOrder -
              secondStatusOrder
            );
          }
          return (
            new Date(
              secondProcedure.updated_at
            ).getTime() -
            new Date(
              firstProcedure.updated_at
            ).getTime()
          );
        }
      );
    }, [
      searchQuery,
      preparedProcedures,
    ]);


  const deleteProcedure = async (
    procedureId
  ) => {
    try {
      setDeleteError("");
      setDeletingProcedureId(
        procedureId
      );

      await api.delete(
        `/api/procedures/${procedureId}/`
      );

      setProcedures(
        (currentProcedures) =>
          currentProcedures.filter(
            (procedure) =>
              procedure.id !==
              procedureId
          )
      );

      setOpenActionsId(null);
    } catch (error) {
      const responseStatus =
        error.response?.status;

      if (responseStatus === 401) {
        setDeleteError(
          "You need to log in."
        );
      } else if (
        responseStatus === 403
      ) {
        setDeleteError(
          "You do not have permission " +
          "to delete this procedure."
        );
      } else if (
        responseStatus === 404
      ) {
        setDeleteError(
          "Procedure was not found."
        );
      } else {
        setDeleteError(
          "Failed to delete procedure."
        );
      }

      console.error(
        "Failed to delete procedure:",
        error
      );
    } finally {
      setDeletingProcedureId(null);
    }
  };


  if (isLoading) {
    return (
      <p>Loading procedures...</p>
    );
  }


  if (error) {
    return (
      <p className="procedures-error">
        {error}
      </p>
    );
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
            setSearchQuery={
              setSearchQuery
            }
            placeholder={
              "Search procedures..."
            }
          />

          <button
            type="button"
            className={
              "procedure-control-button"
            }
          >
            Filter
          </button>

          <button
            type="button"
            className={
              "procedure-control-button"
            }
          >
            Sort
          </button>

          {canCreateProcedure && (
            <button
              type="button"
              className={
                "procedure-create-button"
              }
              onClick={() =>
                navigate(
                  "/procedure/create"
                )
              }
            >
              Create procedure
            </button>
          )}
        </div>
      </div>


      {deleteError && (
        <p className="procedures-error">
          {deleteError}
        </p>
      )}


      <div
        className={
          "procedures-table-container"
        }
      >
        {procedures.length === 0 ? (
          <p>No procedures found.</p>
        ) : filteredProcedures.length ===
          0 ? (
          <p>
            No procedures match your
            search.
          </p>
        ) : (
          <table className="procedures-table">
            <colgroup>
              <col
                className={
                  "column-procedure"
                }
              />
              <col
                className={
                  "column-version"
                }
              />
              <col
                className={
                  "column-status"
                }
              />
              <col
                className={
                  "column-created"
                }
              />
              <col
                className={
                  "column-actions"
                }
              />
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
              {filteredProcedures.map(
                (procedure) => (
                  <ProcedureItem
                    key={procedure.id}
                    procedure={procedure}
                    permissions={
                      permissions
                    }
                    isActionsOpen={
                      openActionsId ===
                      procedure.id
                    }
                    isDeleting={
                      deletingProcedureId ===
                      procedure.id
                    }
                    onActionsClose={() => {
                      setOpenActionsId(
                        null
                      );
                    }}
                    onActionsToggle={() => {
                      setOpenActionsId(
                        (currentId) =>
                          currentId ===
                          procedure.id
                            ? null
                            : procedure.id
                      );
                    }}
                    onDeleteProc={
                      deleteProcedure
                    }
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