import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import api from "../api/api";
import ReviewItemProcedure from "../procedure/ReviewItemProcedure";
import "../../styles/ReviewProcedurePage.css";

const PAGE_SIZE = 7;

const ReviewProcedurePage = ({ permissions = [] }) => {
  const [reviewProcedures, setReviewProcedures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [changeTypeFilter, setChangeTypeFilter] = useState("all");
  const [sort, setSort] = useState("submitted_desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();

    const loadProcedures = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api.get("/api/procedures/review/", {
          signal: controller.signal,
        });

        setReviewProcedures(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        if (error.code === "ERR_CANCELED" || controller.signal.aborted) {
          return;
        }

        const responseStatus = error.response?.status;

        if (responseStatus === 401) {
          setError("You need to log in.");
        } else if (responseStatus === 403) {
          setError("You do not have permission to review procedures.");
        } else {
          setError("Failed to load procedures.");
        }

        console.error("Failed to load procedures:", error);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadProcedures();

    return () => {
      controller.abort();
    };
  }, []);

  const filteredProcedures = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return reviewProcedures
      .filter((procedure) => {
        const title = procedure.title?.toLowerCase() ?? "";
        const description = procedure.description?.toLowerCase() ?? "";
        const username = procedure.created_by?.username?.toLowerCase() ?? "";
        const firstName = procedure.created_by?.first_name?.toLowerCase() ?? "";
        const lastName = procedure.created_by?.last_name?.toLowerCase() ?? "";

        const matchesSearch =
          !query ||
          title.includes(query) ||
          description.includes(query) ||
          username.includes(query) ||
          firstName.includes(query) ||
          lastName.includes(query);

        const matchesChangeType =
          changeTypeFilter === "all" ||
          (changeTypeFilter === "null" && procedure.change_type === null) ||
          procedure.change_type === changeTypeFilter;
          
        return matchesSearch && matchesChangeType;
      })
      .sort((a, b) => {
        const direction = sort.endsWith("asc") ? 1 : -1;

        return (
          (new Date(a.submitted_at).getTime() -
            new Date(b.submitted_at).getTime()) *
          direction
        );
      });
  }, [reviewProcedures, searchQuery, changeTypeFilter, sort]);

  const pageCount = Math.max(
    1,
    Math.ceil(filteredProcedures.length / PAGE_SIZE),
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery, changeTypeFilter, sort]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const first = filteredProcedures.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const last = Math.min(page * PAGE_SIZE, filteredProcedures.length);

  const visibleProcedures = filteredProcedures.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  if (isLoading) {
    return <p>Loading procedures...</p>;
  }

  if (error) {
    return <p className="review-error">{error}</p>;
  }

  return (
    <section className="review-section">
      <header className="review-page-header">
        <div>
          <h1>Procedure review</h1>

          <p>Review procedure versions submitted for approval</p>
        </div>

        <div className="review-summary">
          <div className="review-summary-icon">
            <Clock3 size={24} />
          </div>

          <div>
            <strong>{reviewProcedures.length}</strong>
            <span>awaiting review</span>
          </div>
        </div>
      </header>

      <div className="review-content">
        <div className="review-toolbar">
          <div className="review-search">
            <Search size={21} />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search submitted procedures..."
            />
          </div>

          <div className="review-filter">
            <select
              value={changeTypeFilter}
              onChange={(event) => setChangeTypeFilter(event.target.value)}
              aria-label="Filter by change type"
            >
              <option value="all">All change types</option>
              <option value="minor">Minor update</option>
              <option value="major">Major update</option>
              <option value="null">Created</option>
            </select>

            <ChevronDown size={18} />
          </div>

          <div className="review-sort">
            <SlidersHorizontal className="review-sort-icon" size={18} />

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="Sort submitted procedures"
            >
              <option value="submitted_desc">Last submitted</option>
              <option value="submitted_asc">Oldest submitted</option>
            </select>

            <ChevronDown className="review-select-chevron" size={18} />
          </div>
        </div>

        <div className="review-table-container">
          <table className="review-table">
            <colgroup>
              <col className="review-column-procedure" />
              <col className="review-column-version" />
              <col className="review-column-change" />
              <col className="review-column-submitter" />
              <col className="review-column-date" />
              <col className="review-column-steps" />
              <col className="review-column-status" />
              <col className="review-column-actions" />
            </colgroup>

            <thead>
              <tr>
                <th>Procedure</th>
                <th>Version</th>
                <th>Change type</th>
                <th>Submitted by</th>
                <th>Submitted</th>
                <th>Steps</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {visibleProcedures.length === 0 ? (
                <tr>
                  <td colSpan="8" className="review-empty">
                    No procedures are waiting for review.
                  </td>
                </tr>
              ) : (
                visibleProcedures.map((procedure) => (
                  <ReviewItemProcedure
                    key={procedure.id}
                    permissions={permissions}
                    reviewProcedure={procedure}
                  />
                ))
              )}
            </tbody>
          </table>

          <footer className="review-table-footer">
            <p>
              Showing {first}–{last} of {filteredProcedures.length} submitted
              procedures
            </p>

            <div className="review-pagination">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((currentPage) => currentPage - 1)}
              >
                <ChevronLeft size={18} />
              </button>

              {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <button
                    type="button"
                    key={pageNumber}
                    className={page === pageNumber ? "active" : ""}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ),
              )}

              <button
                type="button"
                disabled={page === pageCount}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
};

export default ReviewProcedurePage;
