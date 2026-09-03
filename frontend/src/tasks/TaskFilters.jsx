import { X } from "lucide-react";
import SearchInput from "../pages/components/SearchInput";
import "../../styles/tasks/TaskToolBar.css"
const TaskFilters = ({
  roles = [],

  searchQuery,
  setSearchQuery,

  roleFilter,
  setRoleFilter,

  datePreset,
  onDatePresetChange,

  dateFrom,
  onDateFromChange,

  dateTo,
  onDateToChange,

  sort,
  setSort,

  onClearDates,
}) => {
  return (
    <div className="task-list-toolbar">
      <div className="task-list-search">
        <SearchInput
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          placeholder="Search tasks or executions"
        />
      </div>

      <label className="task-filter-field">
        <span>Role</span>

        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
        >
          <option value="all">All roles</option>

          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </label>

      <label className="task-filter-field">
        <span>Period</span>

        <select value={datePreset} onChange={onDatePresetChange}>
          <option value="this_week">This week</option>
          <option value="custom">Custom dates</option>
          <option value="all">All dates</option>
        </select>
      </label>

      <label className="task-filter-field">
        <span>From</span>

        <input
          type="date"
          value={dateFrom}
          max={dateTo || undefined}
          onChange={onDateFromChange}
        />
      </label>

      <label className="task-filter-field">
        <span>To</span>

        <input
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={onDateToChange}
        />
      </label>

      <label className="task-filter-field">
        <span>Sort by</span>

        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="deadline_asc">Deadline: nearest</option>
          <option value="deadline_desc">Deadline: latest</option>
          <option value="created_desc">Newest first</option>
          <option value="created_asc">Oldest first</option>
        </select>
      </label>

      {(dateFrom || dateTo) && (
        <button
          className="task-date-clear"
          type="button"
          title="Clear date range"
          aria-label="Clear date range"
          onClick={onClearDates}
        >
          <X size={18} />
          Clear
        </button>
      )}
    </div>
  );
};

export default TaskFilters;
