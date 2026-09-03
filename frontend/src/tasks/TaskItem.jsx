import "../../styles/tasks/TaskItem.css";

const TaskItem = ({
  task,
  execution,
  onClick,
}) => {
  const [contextTitle, contextTarget] = (
    execution.context ?? ""
  ).split(" for ");

  const formatDeadline = (deadline) => {
    if (!deadline) {
      return "No deadline";
    }

    const deadlineDate = new Date(deadline);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);

    const differenceInMilliseconds =
      deadlineDate - today;

    const differenceInDays = Math.round(
      differenceInMilliseconds /
        (1000 * 60 * 60 * 24),
    );

    const weekday =
      deadlineDate.toLocaleDateString(
        "en-US",
        {
          weekday: "short",
        },
      );

    if (differenceInDays < 0) {
      return "Overdue";
    }

    if (differenceInDays === 0) {
      return "Today";
    }

    if (differenceInDays === 1) {
      return `Tomorrow, ${weekday}`;
    }

    if (differenceInDays <= 7) {
      return weekday;
    }

    return deadlineDate.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
      },
    );
  };

  const documentsCount =
    task.reference_documents?.length ?? 0;

  return (
    <div
      className="task-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          onClick();
        }
      }}
    >
      {contextTarget && (
        <p className="task-card__target">
          {contextTarget}
        </p>
      )}

      <h3 className="task-card__title">
        {task.description}
      </h3>

      {contextTitle && (
        <p className="task-card__context">
          {contextTitle}
        </p>
      )}

      <div className="deadline-documents">
        <p className="task-deadline">
          <span>Due</span>

          <strong>
            {formatDeadline(
              execution.deadline,
            )}
          </strong>
        </p>

        <p className="task-documents">
          {documentsCount}{" "}
          {documentsCount === 1
            ? "document"
            : "documents"}
        </p>
      </div>
    </div>
  );
};

export default TaskItem;