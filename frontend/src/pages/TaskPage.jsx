import { useEffect, useState } from "react";
import SearchInput from "./components/SearchInput";
import api from "../api/api";
import ExecutionItem from "../tasks/TaskItem";

const TaskPage = ({
     permissions = [],
     user 
}) => {
  const [executions, setExecutions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("all");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
        console.log(response.data);
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
          setError("")
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
      <header>
        <h1>Procedure execution</h1>

        <p>Track procedure runs and complete assigned tasks</p>
      </header>

      <div className="task-view-toggle">
        <button
          type="button"
          className={viewMode === "all" ? "active" : ""}
          onClick={() => setViewMode("all")}
        >
          All executions
        </button>

        <button
          type="button"
          className={viewMode === "mine" ? "active" : ""}
          onClick={() => setViewMode("mine")}
        >
          My tasks
        </button>
      </div>

      <div>
        <SearchInput
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          placeholder="Search tasks or executions"
        />

        <select defaultValue="all">
          <option value="all">All assignees</option>
        </select>
      </div>
            {executions.map((execution)=>(
                execution.tasks.map((task)=>(
                    <TaskItem 
                        key={task.task_id}
                        task={task}
                        execution={execution}
                    />
                ))
                
            ))}
    </main>
  );
};

export default TaskPage;
