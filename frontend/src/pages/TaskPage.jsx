import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";

import TaskItem from "../tasks/TaskItem";
import TaskFilters from "../tasks/TaskFilters";
import TaskViewToggle from "../tasks/TaskViewToggle";
import ExecutionDetailsModal from "../tasks/ExecutionDetailsModal";
import TaskBoard from "../tasks/TaskBoard";
import Can from "./components/Can";

import "../../styles/tasks/TaskBoard.css";
import "../../styles/tasks/TaskPage.css";

const formatDateForInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentWeekRange = () => {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const monday = new Date(today);
  const dayNumber = today.getDay();
  const daysSinceMonday = dayNumber === 0 ? 6 : dayNumber - 1;

  monday.setDate(today.getDate() - daysSinceMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    from: formatDateForInput(monday),
    to: formatDateForInput(sunday),
  };
};

const isTaskAssignedToUser = (task, user) => {
  const assignedDirectly = task.assigned_to?.id === user?.id;

  const assignedByRole =
    user?.roles?.some((role) => {
      if (!task.assigned_role) {
        return false;
      }
      if (typeof role === "object") {
        return role.id === task.assigned_role.id;
      }

      return role === task.assigned_role.name;
    }) ?? false;

  return assignedDirectly || assignedByRole;
};

const TaskPage = ({ permissions = [], user }) => {
  const navigate = useNavigate();

  const [executions, setExecutions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const [datePreset, setDatePreset] = useState("this_week");
  const [dateFrom, setDateFrom] = useState(() => getCurrentWeekRange().from);
  const [dateTo, setDateTo] = useState(() => getCurrentWeekRange().to);

  const [sort, setSort] = useState("deadline_asc");
  const [selectedTaskItem, setSelectedTaskItem] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError("");

        const [tasksResponse, rolesResponse] = await Promise.all([
          api.get("/api/tasks/", {
            signal: controller.signal,
          }),

          api.get("/api/auth/roles/", {
            signal: controller.signal,
          }),
        ]);

        setExecutions(tasksResponse.data);

        setRoles(rolesResponse.data);
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

    loadData();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (datePreset !== "this_week") {
      return undefined;
    }

    let timeoutId;

    const scheduleNextUpdate = () => {
      const now = new Date();

      const nextMidnight = new Date(now);
      nextMidnight.setDate(now.getDate() + 1);
      nextMidnight.setHours(0, 0, 1, 0);
      const delay = nextMidnight.getTime() - now.getTime();

      timeoutId = setTimeout(() => {
        const currentWeek = getCurrentWeekRange();

        setDateFrom(currentWeek.from);
        setDateTo(currentWeek.to);

        scheduleNextUpdate();
      }, delay);
    };

    scheduleNextUpdate();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [datePreset]);

  const allTasks = useMemo(
    () =>
      executions.flatMap((execution) =>
        (execution.tasks ?? []).map((task) => ({
          task,
          execution,
        })),
      ),
    [executions],
  );

  const filteredAllTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allTasks
      .filter(({ task, execution }) => {
        if (!query) {
          return true;
        }

        const searchableValues = [
          task.description,
          execution.context,
          execution.procedure_version?.title,
          task.assigned_to?.username,
          task.assigned_to?.first_name,
          task.assigned_to?.last_name,
          task.assigned_role?.name,
        ];

        return searchableValues.some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query),
        );
      })

      .filter(({ task }) => {
        if (roleFilter === "all") {
          return true;
        }

        return task.assigned_role?.id === Number(roleFilter);
      })

      .filter(({ execution }) => {
        if (!dateFrom && !dateTo) {
          return true;
        }

        if (!execution.deadline) {
          return false;
        }
        const deadlineDate = new Date(execution.deadline);

        if (Number.isNaN(deadlineDate.getTime())) {
          return false;
        }

        if (dateFrom) {
          const fromDate = new Date(`${dateFrom}T00:00:00`);

          if (deadlineDate < fromDate) {
            return false;
          }
        }

        if (dateTo) {
          const toDate = new Date(`${dateTo}T23:59:59.999`);

          if (deadlineDate > toDate) {
            return false;
          }
        }

        return true;
      })

      .sort((firstItem, secondItem) => {
        if (sort.startsWith("deadline")) {
          const firstDeadline = firstItem.execution.deadline;
          const secondDeadline = secondItem.execution.deadline;

          if (!firstDeadline && !secondDeadline) {
            return 0;
          }
          if (!firstDeadline) {
            return 1;
          }
          if (!secondDeadline) {
            return -1;
          }

          const difference = new Date(firstDeadline) - new Date(secondDeadline);
          return sort === "deadline_asc" ? difference : -difference;
        }

        const firstCreatedAt =
          firstItem.task.created_at ?? firstItem.execution.started_at;
        const secondCreatedAt =
          secondItem.task.created_at ?? secondItem.execution.started_at;
        const difference = new Date(firstCreatedAt) - new Date(secondCreatedAt);

        return sort === "created_asc" ? difference : -difference;
      });
  }, [allTasks, searchQuery, roleFilter, dateFrom, dateTo, sort]);

  const filteredMyTasks = useMemo(
    () =>
      filteredAllTasks.filter(({ task }) => isTaskAssignedToUser(task, user)),
    [filteredAllTasks, user],
  );

  const filteredUnassignedTasks = useMemo(
    () =>
      filteredAllTasks.filter(
        ({ task }) => !task.assigned_to && !task.assigned_role,
      ),
    [filteredAllTasks],
  );

  const visibleTasks = useMemo(() => {
    if (viewMode === "mine") {
      return filteredMyTasks;
    }

    if (viewMode === "unassigned") {
      return filteredUnassignedTasks;
    }

    return filteredAllTasks;
  }, [viewMode, filteredAllTasks, filteredMyTasks, filteredUnassignedTasks]);

  const handleDatePresetChange = (event) => {
    const preset = event.target.value;
    setDatePreset(preset);

    if (preset === "this_week") {
      const currentWeek = getCurrentWeekRange();
      setDateFrom(currentWeek.from);
      setDateTo(currentWeek.to);
      return;
    }

    if (preset === "all") {
      setDateFrom("");
      setDateTo("");
    }
  };

  const handleDateFromChange = (event) => {
    setDateFrom(event.target.value);
    setDatePreset("custom");
  };

  const handleDateToChange = (event) => {
    setDateTo(event.target.value);
    setDatePreset("custom");
  };

  const clearDateRange = () => {
    setDateFrom("");
    setDateTo("");
    setDatePreset("all");
  };

  const onTaskStatusUpdate = ({ taskId, status }) => {
    setExecutions((previousExecutions) =>
      previousExecutions.map((execution) => ({
        ...execution,

        tasks: execution.tasks.map((task) =>
          task.task_id === taskId
            ? {
                ...task,
                status,
              }
            : task,
        ),
      })),
    );

    setSelectedTaskItem(null);
  };

  if (isLoading) {
    return <p className="task-page-message">Loading tasks...</p>;
  }

  if (error) {
    return <p className="task-page-message task-error">{error}</p>;
  }

  return (
    <main className="task-page">
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
            onClick={() => navigate("/execution/create")}
          >
            <Plus size={21} />
            Start execution
          </button>
        </Can>
      </header>

      <TaskViewToggle
        viewMode={viewMode}
        setViewMode={setViewMode}
        allCount={filteredAllTasks.length}
        myCount={filteredMyTasks.length}
        unassignedCount={filteredUnassignedTasks.length}
      />

      <TaskFilters
        roles={roles}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        datePreset={datePreset}
        onDatePresetChange={handleDatePresetChange}
        dateFrom={dateFrom}
        onDateFromChange={handleDateFromChange}
        dateTo={dateTo}
        onDateToChange={handleDateToChange}
        sort={sort}
        setSort={setSort}
        onClearDates={clearDateRange}
      />

      {visibleTasks.length === 0 && (
        <div className="task-filter-empty">
          <h3>No matching tasks</h3>

          <p>Try changing the search, role or date filters.</p>

          {(dateFrom || dateTo) && (
            <button type="button" onClick={clearDateRange}>
              Show all dates
            </button>
          )}
        </div>
      )}

      <TaskBoard tasks={visibleTasks} onTaskSelect={setSelectedTaskItem} />

      {selectedTaskItem && (
        <ExecutionDetailsModal
          permissions={permissions}
          user={user}
          task={selectedTaskItem.task}
          execution={selectedTaskItem.execution}
          onClose={() => setSelectedTaskItem(null)}
          onTaskStatusUpdate={onTaskStatusUpdate}
        />
      )}
    </main>
  );
};

export default TaskPage;
