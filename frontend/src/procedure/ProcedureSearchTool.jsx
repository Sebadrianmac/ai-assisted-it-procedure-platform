import { useNavigate } from "react-router-dom";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import SearchInput from "../pages/components/SearchInput";

const ProcedureSearchTool = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  canCreateProcedure,
  sortDate,
  setSortDate,
}) => {
  const navigate = useNavigate();

  return (
    <div className="procedures-controls">
      <SearchInput
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Search procedures..."
      />

      <div className="procedure-filter">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter procedures by status"
        >
          <option value="all">All statuses</option>
          <option value="in_progress">Draft</option>
          <option value="clarification_needed">Clarification needed</option>
          <option value="created">Waiting for approval</option>
          <option value="completed">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <ChevronDown size={18} aria-hidden="true" />
        </div>
      <div className="procedure-filter">         
          <SlidersHorizontal />
          <select
            value={sortDate}
            onChange={(e) => setSortDate(e.target.value)}
            aria-label="Filrer procedure by date create or update"
          >
            <option value="updated_desc">Last updated</option>
            <option value="updated_asc">Oldest updated</option>
            <option value="created_desc">Newest created</option>
            <option value="created_asc">Oldest created</option>
          </select>
      </div>

      {canCreateProcedure && (
        <button
          type="button"
          className="procedure-create-button"
          onClick={() => navigate("/procedure/create")}
        >
          Create procedure
        </button>
      )}
    </div>
  );
};

export default ProcedureSearchTool;
