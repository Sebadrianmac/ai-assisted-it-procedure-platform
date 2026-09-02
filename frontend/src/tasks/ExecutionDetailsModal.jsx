import { ExternalLink, FileText, Link2, X } from "lucide-react";

import "../../styles/tasks/ExecutionDetailsModal.css";
import Can from "../pages/components/Can";
import { useNavigate } from "react-router-dom";

const ExecutionDetailsModal = ({ 
    permissions,
    task, 
    execution, 
    onClose 
}) => {
    const navigation = useNavigate()
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
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <footer className="execution-modal__footer">
          <button
            className="execution-modal__cancel"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
          <Can
          permissions={permissions}
          permission="tasks.assign_task"
          >
            <button 
            className="execution-modal__edit" 
            type="button"
            onClick={()=>navigation("/executions/:executionId/edit")}
            >
              Manage execution
            </button>
          </Can>
        </footer>
      </div>
    </div>
  );
};

export default ExecutionDetailsModal;
