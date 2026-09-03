const TaskViewToggle = ({
  viewMode,
  setViewMode,
  allCount,
  myCount,
  unassignedCount,
}) => {
  return (
    <div className="task-view-toggle">
      <button
        type="button"
        className={
          viewMode === "all"
            ? "active"
            : ""
        }
        onClick={() =>
          setViewMode("all")
        }
      >
        All Tasks

        <span>{allCount}</span>
      </button>

      <button
        type="button"
        className={
          viewMode === "mine"
            ? "active"
            : ""
        }
        onClick={() =>
          setViewMode("mine")
        }
      >
        My Tasks

        <span>{myCount}</span>
      </button>

      <button
        type="button"
        className={
          viewMode === "unassigned"
            ? "active"
            : ""
        }
        onClick={() =>
          setViewMode("unassigned")
        }
      >
        Unassigned

        <span>{unassignedCount}</span>
      </button>
    </div>
  );
};

export default TaskViewToggle;