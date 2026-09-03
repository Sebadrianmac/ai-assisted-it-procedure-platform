import { useEffect, useRef, useState } from "react";
import SearchInput from "../pages/components/SearchInput";

import "../../styles/tasks/AssignmentSelect.css"

const AssignmentSelect = ({
  type,
  roles = [],
  users = [],
  selectedId = "",
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selectRef = useRef(null);

  const options = type === "role" ? roles : users;

  const getOptionLabel = (option) => {
    if (type === "role") {
      return option.name;
    }

    const fullName =
      `${option.first_name || ""} ${option.last_name || ""}`.trim();

    return fullName || option.username;
  };

  const filteredOptions = options.filter((option) =>
    getOptionLabel(option)
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase()),
  );

  useEffect(() => {
    const selectedOption = options.find(
      (option) => option.id === Number(selectedId),
    );

    if (selectedOption) {
      setSearchQuery(getOptionLabel(selectedOption));
    }
  }, [selectedId, type]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      closeOnOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeOnOutsideClick,
      );
    };
  }, []);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setIsOpen(true);

    // Если пользователь меняет текст,
    // старый выбранный ID больше не подходит.
    onSelect("");
  };

  const handleSelect = (option) => {
    onSelect(option.id);
    setSearchQuery(getOptionLabel(option));
    setIsOpen(false);
  };

  return (
    <div
      className="assignment-select"
      ref={selectRef}
      onFocusCapture={() => setIsOpen(true)}
    >
      <SearchInput
        searchQuery={searchQuery}
        setSearchQuery={handleSearchChange}
        placeholder={
          type === "role"
            ? "Search or select a role..."
            : "Search or select a user..."
        }
      />

      {isOpen && (
        <div className="assignment-select__options">
          {filteredOptions.map((option) => {
            const isSelected =
              Number(selectedId) === option.id;

            return (
              <button
                type="button"
                key={option.id}
                className={
                  isSelected
                    ? "assignment-select__option active"
                    : "assignment-select__option"
                }
                onClick={() => handleSelect(option)}
              >
                {getOptionLabel(option)}
              </button>
            );
          })}

          {filteredOptions.length === 0 && (
            <p className="assignment-select__empty">
              No results found
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AssignmentSelect;