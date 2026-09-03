import { ExternalLink, FileText, Link2, User, X } from "lucide-react";

import "../../styles/tasks/ExecutionDetailsModal.css";
import Can from "../pages/components/Can";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { use, useState } from "react";
import { Ban, Check, Play, RotateCcw } from "lucide-react";
const ExecutionDetailsModal = ({
  permissions,
  user,
  task,
  execution,
  onClose,
  onTaskStatusUpdate,
}) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [statusError, setStatusError] = useState("");
  const navigation = useNavigate();
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

  const getDocumentUrl = (document) => {
    return document.file_url || document.external_url || null;
  };

  const formatStatus = (status) => {
    if (!status) {
      return "Unknown";
    }

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const executionTasks = execution?.tasks ?? [];
  const selectedTaskId = task.task_id;

  const changeTaskStatus = async (taskId, newStatus) => {
    try {
      setIsUpdatingStatus(true);
      setStatusError("");

      const response = await api.put(`/api/tasks/${task.task_id}/`, {
        status: newStatus,
      });

      onTaskStatusUpdate({
        taskId: task.task_id,
        status: response.data.status,
      });
    } catch (error) {
      if (error.response?.status === 403) {
        setStatusError("You cannot change this task status.");
      } else {
        setStatusError("Failed to update task status.");
      }

      console.error("Failed to update task status:", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  return (
    <div className="execution-modal-overlay" onClick={onClose}>
      <div
        className="execution-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="execution-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="execution-modal__header">
          <div className="execution-modal__header-left">
            <div className="execution-modal__execution-info">
              <span>Execution #{execution.id}</span>

              <span
                className={`status-badge status-badge--${execution.status}`}
              >
                {formatStatus(execution.status)}
              </span>
            </div>

            <h2 id="execution-modal-title">
              {execution.procedure_version.title}
            </h2>
          </div>

          <div className="execution-modal__header-right">
            <div className="execution-modal__info-item">
              <span>Started by</span>

              <strong>
                {execution.started_by.first_name}{" "}
                {execution.started_by.last_name}
              </strong>
            </div>

            <div className="execution-modal__info-item">
              <span>Started at</span>

              <strong>{formatDate(execution.started_at)}</strong>
            </div>

            <button
              className="execution-modal__close"
              type="button"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
        </header>

        <div className="execution-modal__body">
          <section className="execution-modal__details">
            <h3>Execution information</h3>

            <div className="execution-modal__details-grid">
              <div className="execution-modal__info-item">
                <span>Deadline</span>

                <strong>
                  {execution.deadline
                    ? formatDate(execution.deadline)
                    : "No deadline"}
                </strong>
              </div>

              {execution.completed_at && (
                <div className="execution-modal__info-item">
                  <span>Completed at</span>

                  <strong>{formatDate(execution.completed_at)}</strong>
                </div>
              )}

              <div className="execution-modal__info-item">
                <span>Total tasks</span>

                <strong>{executionTasks.length}</strong>
              </div>
            </div>
          </section>

          <section className="execution-modal__context">
            <h3>Context</h3>

            <p>{execution.context || "No context provided"}</p>
          </section>

          <section className="execution-modal__tasks">
            <div className="execution-modal__section-header">
              <h3>Execution tasks</h3>

              <span>{executionTasks.length}</span>
            </div>

            <ul className="execution-modal__task-list">
              {executionTasks.map((executionTask, index) => {
                const isSelected = executionTask.task_id === selectedTaskId;
                const documents = executionTask.reference_documents ?? [];
                const assignedUser = executionTask.assigned_to;
                const assignedRole = executionTask.assigned_role;

                const assignedDirectly = assignedUser?.id === user?.id;

                const assignedThroughRole = user?.roles?.some((userRole) => {
                  if (!assignedRole) {
                    return false;
                  }

                  if (typeof userRole === "object") {
                    return userRole.id === assignedRole.id;
                  }

                  return userRole === assignedRole.name;
                });

                const isMyAssignedTask =
                  assignedDirectly || assignedThroughRole;
                return (
                  <li
                    key={executionTask.task_id}
                    className={
                      isSelected
                        ? "execution-task execution-task--selected"
                        : "execution-task"
                    }
                  >
                    <span className="task-number">{index + 1}</span>

                    <div className="procedure-task-content">
                      <div className="procedure-task-content-left">
                        <div className="execution-task__title">
                          <p className="procedure-task-description">
                            {executionTask.description}
                          </p>

                          {isSelected && (
                            <span className="selected-task-label">
                              Selected
                            </span>
                          )}
                        </div>

                        <div className="execution-task__assignee">
                          <span>Assigned to:</span>

                          <strong>
                            {assignedUser
                              ? `${assignedUser.first_name} ${assignedUser.last_name}`.trim() ||
                                assignedUser.username
                              : assignedRole
                                ? assignedRole.name
                                : "Unassigned"}
                          </strong>
                        </div>

                        {documents.length > 0 && (
                          <div className="step-reference-documents">
                            <span className="step-reference-label">
                              Reference documents
                            </span>

                            <div className="step-reference-list">
                              {documents.map((document) => {
                                const url = getDocumentUrl(document);

                                const Icon = document.file_url
                                  ? FileText
                                  : Link2;

                                const content = (
                                  <>
                                    <Icon size={17} />

                                    <span>{document.title}</span>

                                    {url && <ExternalLink size={15} />}
                                  </>
                                );

                                return url ? (
                                  <a
                                    className="step-reference-document"
                                    key={document.id}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {content}
                                  </a>
                                ) : (
                                  <span
                                    className="step-reference-document"
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

                      <div className="procedure-task-content-right">
                        <span
                          className={`status-badge status-badge--${executionTask.status}`}
                        >
                          {formatStatus(executionTask.status)}
                        </span>
                        {isMyAssignedTask ? (
                          <div className="execution-task__actions">
                            {executionTask.status === "created" && (
                              <button
                                type="button"
                                className="action-start"
                                title="Start task"
                                aria-label="Start task"
                                onClick={() =>
                                  changeTaskStatus(
                                    executionTask.task_id,
                                    "in_progress",
                                  )
                                }
                              >
                                <Play size={18} />
                              </button>
                            )}

                            {executionTask.status === "in_progress" && (
                              <>
                                <button
                                  type="button"
                                  className="action-complete"
                                  title="Complete task"
                                  aria-label="Complete task"
                                  onClick={() =>
                                    changeTaskStatus(
                                      executionTask.task_id,
                                      "completed",
                                    )
                                  }
                                >
                                  <Check size={18} />
                                </button>

                                <button
                                  type="button"
                                  className="action-block"
                                  title="Block task"
                                  aria-label="Block task"
                                  onClick={() =>
                                    changeTaskStatus(
                                      executionTask.task_id,
                                      "blocked",
                                    )
                                  }
                                >
                                  <Ban size={18} />
                                </button>
                              </>
                            )}

                            {executionTask.status === "blocked" && (
                              <button
                                type="button"
                                title="Resume task"
                                className="action-resume"
                                aria-label="Resume task"
                                onClick={() =>
                                  changeTaskStatus(
                                    executionTask.task_id,
                                    "in_progress",
                                  )
                                }
                              >
                                <RotateCcw size={18} />
                              </button>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <footer className="execution-modal__footer">
          <div className="task-actions-legend">
            <span className="task-actions-legend__title">Task actions:</span>

            <div className="task-actions-legend__item">
              <span className="task-actions-legend__icon action--start">
                <Play size={15} />
              </span>

              <span>Start task</span>
            </div>

            <div className="task-actions-legend__item">
              <span className="task-actions-legend__icon action--complete">
                <Check size={15} />
              </span>

              <span>Complete task</span>
            </div>

            <div className="task-actions-legend__item">
              <span className="task-actions-legend__icon action--block">
                <Ban size={15} />
              </span>

              <span>Block task</span>
            </div>

            <div className="task-actions-legend__item">
              <span className="task-actions-legend__icon action--resume">
                <RotateCcw size={15} />
              </span>

              <span>Resume task</span>
            </div>
          </div>
          <div>
            <button
              className="execution-modal__cancel"
              type="button"
              onClick={onClose}
            >
              Close
            </button>
            <Can permissions={permissions} permission="tasks.assign_task">
              <button
                className="execution-modal__edit"
                type="button"
                onClick={() => {
                  navigation(`/executions/${execution.id}/edit`);
                }}
              >
                Manage execution
              </button>
            </Can>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ExecutionDetailsModal;
