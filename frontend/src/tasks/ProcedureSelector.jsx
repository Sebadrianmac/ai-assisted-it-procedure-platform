import SearchInput from "../pages/components/SearchInput";
import "../../styles/tasks/ProcedureSelector.css"

const ProcedureSelector = ({
  procedures,
  searchQuery,
  setSearchQuery,
  selectedProcedureId,
  onProcedureSelect,
  isOpen,
  setIsOpen,
}) => {
  const filteredProcedures = procedures
    .filter((procedure) => procedure.current_version)
    .filter((procedure) =>
      procedure.current_version.title
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase()),
    );

  return (
    <div
      className="procedure-search"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocusCapture={() => setIsOpen(true)}
    >
      <label>Procedure</label>

      <SearchInput
        searchQuery={searchQuery}
        setSearchQuery={(value) => {
          setSearchQuery(value);
          onProcedureSelect("");
        }}
        placeholder="Search or select a procedure..."
      />

      {isOpen && (
        <div className="procedure-options">
          {filteredProcedures.map((procedure) => (
            <button
              className={
                Number(selectedProcedureId) === procedure.id
                  ? "procedure-option active"
                  : "procedure-option"
              }
              type="button"
              key={procedure.id}
              onClick={() => {
                onProcedureSelect(procedure.id);
                setSearchQuery(
                  procedure.current_version.title,
                );
                setIsOpen(false);
              }}
            >
              <strong>
                {procedure.current_version.title}
              </strong>

              <span>
                Version{" "}
                {procedure.current_version.version_number}
              </span>
            </button>
          ))}

          {filteredProcedures.length === 0 && (
            <p className="procedure-no-results">
              No approved procedures found
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProcedureSelector;