import { Search } from "lucide-react";

import "../../../styles/SearchInput.css";

const SearchInput = ({
  searchQuery,
  setSearchQuery,
  placeholder = "Search...",
}) => {
  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="search-input">
      <Search
        className="search-input__icon"
        size={20}
      />

      <input
        className="search-input__field"
        type="search"
        value={searchQuery}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) =>
          setSearchQuery(event.target.value)
        }
      />

      {searchQuery && (
        <button
          className="search-input__clear"
          type="button"
          aria-label="Clear search"
          onClick={clearSearch}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default SearchInput;