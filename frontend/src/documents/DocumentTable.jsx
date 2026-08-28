import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import DocumentItem from "./DocumentItem";
import SearchInput from "../pages/components/SearchInput";

export default function DocumentTable(props) {
  const {
    documents,
    isLoading,
    search,
    onSearch,
    type,
    onType,
    sort,
    onSort,
    page,
    pageCount,
    total,
    pageSize,
    onPage,
    canUpdate,
    canDelete,
    onEdit,
    onDelete,
  } = props;
  const first = total ? (page - 1) * pageSize + 1 : 0;
  const last = Math.min(page * pageSize, total);

  return (
    <section className="documents-panel">
      <div className="documents-toolbar">
        <SearchInput
          searchQuery={search}
          setSearchQuery={onSearch}
          placeholder="Search documents..."
        />
        <label className="select-field">
          <select value={type} onChange={(e) => onType(e.target.value)}>
            <option value="all">Document type</option>
            <option value="policy">Policy</option>
            <option value="standard">Standard</option>
            <option value="contract">Contract</option>
            <option value="regulation">Regulation</option>
            <option value="internal">Internal</option>
          </select>
          <ChevronDown />
        </label>
        <label className="select-field sort-field">
          <SlidersHorizontal />
          <select value={sort} onChange={(e) => onSort(e.target.value)}>
            <option value="updated_desc">Last updated</option>
            <option value="updated_asc">Oldest updated</option>
            <option value="created_desc">Newest created</option>
            <option value="created_asc">Oldest created</option>
          </select>
          <ChevronDown />
        </label>
      </div>
      <div className="table-scroll">
        <table className="documents-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Document type</th>
              <th>Source</th>
              <th>Uploaded by</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" className="empty-row">
                  Loading documents...
                </td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-row">
                  No documents found.
                </td>
              </tr>
            ) : (
              documents.map((document) => (
                <DocumentItem
                  key={document.id}
                  document={document}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      <footer className="table-footer">
        <p>
          Showing {first}–{last} of {total} documents
        </p>
        <nav className="pagination">
          <button disabled={page === 1} onClick={() => onPage(page - 1)}>
            <ChevronLeft />
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1)
            .slice(Math.max(0, page - 3), Math.max(3, page + 2))
            .map((number) => (
              <button
                key={number}
                className={number === page ? "active" : ""}
                onClick={() => onPage(number)}
              >
                {number}
              </button>
            ))}
          <button
            disabled={page === pageCount}
            onClick={() => onPage(page + 1)}
          >
            <ChevronRight />
          </button>
        </nav>
      </footer>
    </section>
  );
}
