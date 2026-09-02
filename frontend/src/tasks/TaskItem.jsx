import "../../styles/tasks/TaskItem.css";
const TaskItem = ({ task, execution }) => {
  const [contextTitle, contextTarget] = (execution.context ?? "").split(
    " for ",
  );
  const formatDeadline = (deadline) => {
    if (!deadline) {
      return "No deadline";
    }

    const deadlineDate = new Date(deadline);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);

    const differenceInMilliseconds = deadlineDate - today;

    const differenceInDays = Math.round(
      differenceInMilliseconds / (1000 * 60 * 60 * 24),
    );

    const weekday = deadlineDate.toLocaleDateString("en-US", {
      weekday: "long",
    });

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

    return deadlineDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };
  const documentsCount = task.reference_documents?.length ?? 0;
  return (
    <div className="task-card">
      {contextTarget && <p>{contextTarget}</p>}
      <h3>{task.description}</h3>
      {contextTitle && <p>{contextTitle}</p>}
      <div className="deadline-documents">
        <p className="task-deadline">
          Due: {formatDeadline(execution.deadline)}
        </p>
        <p className="task-documents">
          {documentsCount} {documentsCount === 1 ? "document" : "documents"}
        </p>{" "}
      </div>
    </div>
  );
};
export default TaskItem;
