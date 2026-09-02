import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";
import ProcedureSelector from "./ProcedureSelector";
import TaskProcedureSteps from "./TaskProcedureSteps";
import { Plus } from "lucide-react";
import "../../styles/tasks/TaskProcedureList.css";
const ExecutionCreate = () => {
  const navigation = useNavigate();
  const [procedures, setProcedures] = useState([]);
  const [selectedProcedureId, setSelectedProcedureId] = useState("");
  const [procedureSteps, setProcedureSteps] = useState([]);
  const [context, setContext] = useState("");
  const [deadline, setDeadline] = useState("");

  const [procedureSearch, setProcedureSearch] = useState("");
  const [isProcedureListOpen, setIsProcedureListOpen] = useState(false);
  const [assignments, setAssignments] = useState({});

  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isStepsLoading, setIsStepsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const loadProcedures = async () => {
      try {
        const [proceduresResponse, rolesResponse, usersResponse] =
          await Promise.all([
            api.get("/api/procedures/", {
              signal: controller.signal,
            }),
            api.get("/api/auth/roles/", {
              signal: controller.signal,
            }),
            api.get("/api/auth/users/", {
              signal: controller.signal,
            }),
          ]);

        setProcedures(proceduresResponse.data);
        setRoles(rolesResponse.data);
        setUsers(usersResponse.data);
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
  useEffect(() => {
    setAssignments({});
    if (!selectedProcedureId) {
      setProcedureSteps([]);
      return;
    }

    const controller = new AbortController();

    const loadProcedureSteps = async () => {
      try {
        setIsStepsLoading(true);
        setError("");

        const response = await api.get(
          `/api/procedures/${selectedProcedureId}/`,
          {
            signal: controller.signal,
          },
        );

        const currentVersion = response.data.current_version;

        setProcedureSteps(currentVersion?.steps ?? []);
      } catch (error) {
        if (error.code === "ERR_CANCELED") {
          return;
        }
        setProcedureSteps([]);
        setError("Failed to load procedure steps.");

        console.error("Failed to load procedure steps:", error);
      } finally {
        if (!controller.signal.aborted) {
          setIsStepsLoading(false);
        }
      }
    };

    loadProcedureSteps();

    return () => {
      controller.abort();
    };
  }, [selectedProcedureId]);

  const selectedProcedure = procedures.find(
    (procedure) => procedure.id === Number(selectedProcedureId),
  );
  const assignedStepsCount = procedureSteps.filter((step) => {
    const assignment = assignments[step.id];

    if (assignment?.type === "role") {
      return Boolean(assignment.assignedRoleId);
    }

    if (assignment?.type === "user") {
      return Boolean(assignment.assignedUserId);
    }

    return false;
  }).length;

  const allStepsAssigned =
    procedureSteps.length > 0 && assignedStepsCount === procedureSteps.length;
  const createExecution = async (event) => {
    event.preventDefault();

    if (!selectedProcedure?.current_version) {
      setError("Select an approved procedure.");
      return;
    }

    const taskAssignments = procedureSteps.map((step) => {
      const assignment = assignments[step.id];

      if (assignment?.type === "user" && assignment.assignedUserId) {
        return {
          procedure_step_id: step.id,
          assigned_to_id: Number(assignment.assignedUserId),
          assigned_role_id: null,
        };
      }

      if (assignment?.type === "role" && assignment.assignedRoleId) {
        return {
          procedure_step_id: step.id,
          assigned_to_id: null,
          assigned_role_id: Number(assignment.assignedRoleId),
        };
      }
      return {
        procedure_step_id: step.id,
        assigned_to_id: null,
        assigned_role_id: null,
      };
    });

    try {
      setIsSubmitting(true);
      setError("");

      await api.post("/api/tasks/", {
        procedure_version_id: selectedProcedure.current_version.id,

        context: context.trim(),

        deadline: deadline ? new Date(deadline).toISOString() : null,

        assignments: taskAssignments,
      });

      navigation("/tasks");
    } catch (error) {
      const responseStatus = error.response?.status;

      if (responseStatus === 400) {
        setError(
          error.response?.data?.detail ||
            "Check execution details and assignments.",
        );
      } else if (responseStatus === 401) {
        setError("You need to log in.");
      } else if (responseStatus === 403) {
        setError("You do not have permission to start an execution.");
      } else {
        setError("Failed to start procedure execution.");
      }

      console.error("Failed to start execution:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const changeAssignmentType = (stepId, type) => {
    setAssignments((previous) => ({
      ...previous,

      [stepId]: {
        type: type,
        assignedRoleId: "",
        assignedUserId: "",
      },
    }));
  };
  const changeAssignee = (stepId, field, value) => {
    setAssignments((previous) => ({
      ...previous,
      [stepId]: {
        ...previous[stepId],
        [field]: value,
      },
    }));
  };
  return (
    <main className="execution-create-page">
      <header className="execution-create-header">
        <div className="execution-create-header__info">
          <h1>Start procedure execution</h1>

          <p>Choose a procedure and assign responsibility for each step.</p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={() => navigation("/procedure/create")}
        >
          <Plus size={21} />
          Add Procedure
        </button>
      </header>

      <form onSubmit={createExecution}>
        <section className="table-main-info">
          <h2>Execution details</h2>

          <div className="execution-fields">
            <ProcedureSelector
              procedures={procedures}
              searchQuery={procedureSearch}
              setSearchQuery={setProcedureSearch}
              selectedProcedureId={selectedProcedureId}
              onProcedureSelect={setSelectedProcedureId}
              isOpen={isProcedureListOpen}
              setIsOpen={setIsProcedureListOpen}
            />

            <div className="execution-field">
              <p className="execution-field-label">Current version</p>

              <strong>
                {selectedProcedure?.current_version
                  ? `v${selectedProcedure.current_version.version_number}`
                  : "—"}
              </strong>
            </div>

            <div className="execution-field">
              <label htmlFor="deadline">
                Deadline
                <span> (optional)</span>
              </label>

              <input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
              />
            </div>

            <div className="execution-field execution-context-field">
              <label htmlFor="context">Execution context</label>

              <input
                id="context"
                type="text"
                value={context}
                onChange={(event) => setContext(event.target.value)}
                placeholder="e.g. Onboarding John Smith for Sales"
              />
            </div>
          </div>
        </section>

        <TaskProcedureSteps
          selectedProcedureId={selectedProcedureId}
          procedureSteps={procedureSteps}
          assignments={assignments}
          roles={roles}
          users={users}
          isLoading={isStepsLoading}
          assignedStepsCount={assignedStepsCount}
          onTypeChange={changeAssignmentType}
          onAssigneeChange={changeAssignee}
        />
        {error && <p className="execution-create-error">{error}</p>}

        <footer className="execution-create-actions">
          <button
            className="cancel-button"
            type="button"
            onClick={() => navigation("/tasks")}
          >
            Cancel
          </button>

          <button
            className="start-execution-button"
            type="submit"
            disabled={
              !selectedProcedureId ||
              isLoading ||
              isStepsLoading ||
              isSubmitting
            }
          >
            {isSubmitting ? "Starting..." : "Start execution"}
          </button>
        </footer>
      </form>
    </main>
  );
};
export default ExecutionCreate;
