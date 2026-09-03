import TaskItem from "./TaskItem";

const statusColumns = [
  {
    value: "created",
    label: "To do",
  },
  {
    value: "in_progress",
    label: "In progress",
  },
  {
    value: "blocked",
    label: "Blocked",
  },
  {
    value: "completed",
    label: "Completed",
  },
];

const TaskBoard = ({ tasks, onTaskSelect }) => {
  return (
    <div className="task-board">
      {statusColumns.map((column) => {
        const columnTasks = tasks.filter(
          ({ task }) => task.status === column.value,
        );

        return (
          <section
            className={`task-column task-column--${column.value}`}
            key={column.value}
          >
            <header className="task-column__header">
              <h2>{column.label.toUpperCase()}</h2>

              <span>{columnTasks.length}</span>
            </header>

            <div className="task-column__list">
              {columnTasks.length === 0 ? (
                <p className="task-column__empty">No tasks</p>
              ) : (
                columnTasks.map(({ task, execution }) => (
                  <TaskItem
                    key={task.task_id}
                    task={task}
                    execution={execution}
                    onClick={() =>
                      onTaskSelect({
                        task,
                        execution,
                      })
                    }
                  />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default TaskBoard;
