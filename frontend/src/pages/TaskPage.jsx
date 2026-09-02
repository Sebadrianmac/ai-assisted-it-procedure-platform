import { use, useEffect, useState } from "react";
import SearchInput from "./components/SearchInput";
import api from "../api/api";
import TaskItem from "../tasks/TaskItem";
import "../../styles/tasks/TaskBoard.css";
import "../../styles/tasks/TaskPage.css";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Can from "./components/Can";

const TaskPage = ({ permissions = [], user }) => {
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
  const [executions, setExecutions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("all");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigate(); 
  const allTasks = executions.flatMap((execution) =>
    execution.tasks.map((task) => ({
      task: task,
      execution: execution,
    })),
  );
  const myTasks = allTasks.filter((item) => {
    const assignedDirectly = item.task.assigned_to?.id === user?.id;

    const assignedByRole = user?.roles?.some(
      (role) => role.id === item.task.assigned_role?.id,
    );

    return assignedDirectly || assignedByRole;
  });
  const visibleTasks = viewMode === "mine" ? myTasks : allTasks;

  useEffect(() => {
    const controller = new AbortController();

    const loadExection = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api.get("/api/tasks/", {
          signal: controller.signal,
        });

        setExecutions(response.data);
      } catch (error) {
        if (error.code === "ERR_CANCELED") {
          return;
        }

        const responseStatus = error.response?.status;

        if (responseStatus === 401) {
          setError("You need to log in.");
        } else if (responseStatus === 403) {
          setError("You do not have permission to view tasks.");
        } else {
          setError("Failed to load tasks.");
        }

        console.error("Failed to load tasks:", error);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadExection();

    return () => {
      controller.abort();
    };
  }, []);
  if (isLoading) {
    return <p>Loading procedures...</p>;
  }

  if (error) {
    return <p className="procedures-error">{error}</p>;
  }
  return (
    <main>
      <header className="tasks-header">
        <div className="info-page">
          <h1>Procedure execution</h1>
          <p>Track procedure runs and complete assigned tasks</p>
        </div>

        <Can
          permissions={permissions}
          permission="tasks.add_procedureexecution"
        >
          <button
            type="button"
            className="add-button"
            onClick={() => navigation("/execution/create")}
          >
            <Plus size={21} />
            Start execution
          </button>
        </Can>
      </header>

      <div className="task-view-toggle">
        <button
          type="button"
          className={viewMode === "all" ? "active" : ""}
          onClick={() => setViewMode("all")}
        >
          All Tasks {allTasks.length}
        </button>

        <button
          type="button"
          className={viewMode === "mine" ? "active" : ""}
          onClick={() => setViewMode("mine")}
        >
          My Tasks {myTasks.length}
        </button>
      </div>

      <div className="task-list-toolbar">
        <SearchInput
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          placeholder="Search tasks or executions"
        />

        <select defaultValue="all">
          <option value="all">All assignees</option>
        </select>
      </div>

      <div className="task-board">
        {statusColumns.map((column) => {
          const columnTasks = visibleTasks.filter(
            (item) => item.task.status === column.value,
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
                  columnTasks.map((item) => (
                    <TaskItem
                      key={item.task.task_id}
                      task={item.task}
                      execution={item.execution}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
};

export default TaskPage;
