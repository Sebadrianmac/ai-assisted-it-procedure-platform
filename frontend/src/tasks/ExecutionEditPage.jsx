import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/api";
import AssignmentSelect from "./AssigmentSelect";

import "../../styles/tasks/ExecutionEditPage.css";
import Can from "../pages/components/Can";

const ExecutionEditPage = ({ permissions = [] }) => {
  const { executionId } = useParams();
  const navigate = useNavigate();

  const [execution, setExecution] = useState(null);

  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const canAssign = permissions.includes("tasks.assign_task");
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
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };
  useEffect(() => {
    const controller = new AbortController();

    const loadExecution = async () => {
      try {
        setIsLoading(true);
        setError("");

        const [executionResponse, rolesResponse, usersResponse] =
          await Promise.all([
            api.get(`/api/tasks/executions/${executionId}/`, {
              signal: controller.signal,
            }),

            api.get("/api/auth/roles/", {
              signal: controller.signal,
            }),

            api.get("/api/auth/users/", {
              signal: controller.signal,
            }),
          ]);

        const loadedExecution = executionResponse.data;

        setExecution(loadedExecution);
        setRoles(rolesResponse.data);
        setUsers(usersResponse.data);

        const initialAssignments = {};

        loadedExecution.tasks.forEach((task) => {
          if (task.assigned_to) {
            initialAssignments[task.task_id] = {
              type: "user",
              assignedUserId: task.assigned_to.id,
              assignedRoleId: "",
            };
          } else if (task.assigned_role) {
            initialAssignments[task.task_id] = {
              type: "role",
              assignedUserId: "",
              assignedRoleId: task.assigned_role.id,
            };
          } else {
            initialAssignments[task.task_id] = {
              type: "",
              assignedUserId: "",
              assignedRoleId: "",
            };
          }
        });

        setAssignments(initialAssignments);
      } catch (error) {
        if (error.code === "ERR_CANCELED") {
          return;
        }

        const responseStatus = error.response?.status;

        if (responseStatus === 401) {
          setError("You need to log in.");
        } else if (responseStatus === 403) {
          setError("You do not have permission to view this execution.");
        } else if (responseStatus === 404) {
          setError("Execution not found.");
        } else {
          setError("Failed to load execution.");
        }

        console.error("Failed to load execution:", error);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadExecution();

    return () => {
      controller.abort();
    };
  }, [executionId]);

  const changeAssignmentType = (taskId, type) => {
    setAssignments((previous) => ({
      ...previous,

      [taskId]: {
        type,
        assignedUserId: "",
        assignedRoleId: "",
      },
    }));
  };

  const changeAssignee = (taskId, field, value) => {
    setAssignments((previous) => ({
      ...previous,

      [taskId]: {
        ...previous[taskId],
        [field]: value,
      },
    }));
  };

  const clearAssignment = (taskId) => {
    setAssignments((previous) => ({
      ...previous,

      [taskId]: {
        type: "",
        assignedUserId: "",
        assignedRoleId: "",
      },
    }));
  };

  const saveAssignments = async (event) => {
    event.preventDefault();

    if (!canAssign) {
      setError("You do not have permission to assign tasks.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const requests = execution.tasks.map((task) => {
        const assignment = assignments[task.task_id];

        return api.put(`/api/tasks/${task.task_id}/assignment/`, {
          assigned_to_id:
            assignment?.type === "user" && assignment.assignedUserId
              ? Number(assignment.assignedUserId)
              : null,

          assigned_role_id:
            assignment?.type === "role" && assignment.assignedRoleId
              ? Number(assignment.assignedRoleId)
              : null,
        });
      });

      await Promise.all(requests);

      navigate("/tasks");
    } catch (error) {
      const responseStatus = error.response?.status;

      if (responseStatus === 400) {
        setError(error.response?.data?.detail || "Check task assignments.");
      } else if (responseStatus === 401) {
        setError("You need to log in.");
      } else if (responseStatus === 403) {
        setError("You do not have permission to assign tasks.");
      } else {
        setError("Failed to save task assignments.");
      }

      console.error("Failed to save assignments:", error);
    } finally {
      setIsSaving(false);
    }
  };
  const canCancelExecution = ["created", "in_progress"].includes(
    execution?.status,
  );
  const handleCancelExecution = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this execution?",
    );

    if (!confirmed) {
      return;
    }
    await api.put(`/api/tasks/executions/${execution.id}/cancel/`)

    navigate("/tasks");
  };
  if (isLoading) {
    return <p>Loading execution...</p>;
  }

  if (error && !execution) {
    return <p className="execution-edit-error">{error}</p>;
  }

  if (!execution) {
    return null;
  }

  return (
    <main className="execution-edit-page">
      <header className="execution-edit-header">
        <div>
          <p>Execution #{execution.id}</p>

          <h1>Manage execution</h1>

          <span>
            {execution.procedure_version.title}
            {" · "}
            Version {execution.procedure_version.version_number}
          </span>
        </div>

        <button
          className="execution-edit-back"
          type="button"
          onClick={() => navigate("/tasks")}
        >
          Back to tasks
        </button>
      </header>

      <section className="execution-edit-summary">
        <div>
          <span>Status: </span>
          <strong>{execution.status}</strong>
        </div>

        <div>
          <span>Context: </span>
          <strong>{execution.context || "No context provided"}</strong>
        </div>

        <div>
          <span>Total tasks: </span>
          <strong>{execution.tasks.length}</strong>
        </div>
        <div>
          <span>Deadline: </span>
          <strong>
            {execution.deadline
              ? formatDate(execution.deadline)
              : "No deadline"}
          </strong>
        </div>
      </section>

      <form onSubmit={saveAssignments}>
        <section className="execution-edit-tasks">
          <header>
            <div>
              <h2>Task assignments</h2>

              <p>Assign each task to a role or specific user.</p>
            </div>
          </header>

          <div className="execution-edit-task-list">
            {execution.tasks.map((task, index) => {
              const assignment = assignments[task.task_id];

              const assignmentType = assignment?.type;

              return (
                <article className="execution-edit-task" key={task.task_id}>
                  <span className="execution-edit-task__number">
                    {index + 1}
                  </span>

                  <div className="execution-edit-task__information">
                    <h3>{task.description}</h3>

                    <span>Status: {task.status}</span>
                  </div>

                  <div className="execution-edit-task__controls">
                    <div className="assignment-type-toggle">
                      <button
                        type="button"
                        className={assignmentType === "role" ? "active" : ""}
                        disabled={!canAssign}
                        onClick={() =>
                          changeAssignmentType(task.task_id, "role")
                        }
                      >
                        Role
                      </button>

                      <button
                        type="button"
                        className={assignmentType === "user" ? "active" : ""}
                        disabled={!canAssign}
                        onClick={() =>
                          changeAssignmentType(task.task_id, "user")
                        }
                      >
                        User
                      </button>
                    </div>

                    {assignmentType && (
                      <AssignmentSelect
                        key={`${task.task_id}-${assignmentType}`}
                        type={assignmentType}
                        roles={roles}
                        users={users}
                        selectedId={
                          assignmentType === "role"
                            ? assignment.assignedRoleId
                            : assignment.assignedUserId
                        }
                        onSelect={(selectedId) =>
                          changeAssignee(
                            task.task_id,

                            assignmentType === "role"
                              ? "assignedRoleId"
                              : "assignedUserId",

                            selectedId,
                          )
                        }
                      />
                    )}

                    {assignmentType && (
                      <button
                        className="execution-edit-task__clear"
                        type="button"
                        disabled={!canAssign}
                        onClick={() => clearAssignment(task.task_id)}
                      >
                        Remove assignment
                      </button>
                    )}

                    {!assignmentType && (
                      <span className="execution-edit-task__unassigned">
                        Unassigned
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {error && <p className="execution-edit-error">{error}</p>}

        <footer className="execution-edit-actions">
          <div>
            {canCancelExecution && (
              <Can
                permissions={permissions}
                permission="tasks.delete_procedureexecution"
              >
                <button
                  type="button"
                  className="execution-edit-cancel-execution"
                  onClick={handleCancelExecution}
                >
                  Cancel execution
                </button>
              </Can>
            )}
          </div>
          <div>
            <button
              type="button"
              className="execution-edit-cancel"
              onClick={() => navigate("/tasks")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="execution-edit-save"
              disabled={!canAssign || isSaving}
            >
              {isSaving ? "Saving..." : "Save assignments"}
            </button>
          </div>
        </footer>
      </form>
    </main>
  );
};

export default ExecutionEditPage;
