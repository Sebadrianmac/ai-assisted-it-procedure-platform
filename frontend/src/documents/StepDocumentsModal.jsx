import { useMemo, useState } from "react";
import { File, Link2, Search, X } from "lucide-react";

const StepDocumentsModal = ({
  stepNumber,
  documents = [],
  selectedDocumentIds = [],
  isLoading = false,
  error = "",
  onClose,
  onAttach,
}) => {
  const [temporarySelectedIds, setTemporarySelectedIds] =
    useState(selectedDocumentIds);

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedType, setSelectedType] = useState("all");

  const availableTypes = useMemo(() => {
    return [...new Set(documents.map((document) => document.document_type))];
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesType =
        selectedType === "all" || document.document_type === selectedType;

      const matchesSearch =
        !query ||
        [
          document.title,
          document.description,
          document.document_type_label,
        ].some((value) => value?.toLowerCase().includes(query));

      return matchesType && matchesSearch;
    });
  }, [documents, searchQuery, selectedType]);

  const handleToggle = (documentId) => {
    setTemporarySelectedIds((currentIds) => {
      const isSelected = currentIds.includes(documentId);

      if (isSelected) {
        return currentIds.filter((id) => id !== documentId);
      }

      return [...currentIds, documentId];
    });
  };

  const handleAttach = () => {
    onAttach(temporarySelectedIds);
  };

  return (
    <div className={"step-documents-backdrop"} onMouseDown={onClose}>
      <section
        className={"step-documents-modal"}
        role="dialog"
        aria-modal="true"
        aria-labelledby={"step-documents-title"}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={"step-documents-header"}>
          <div>
            <h2 id="step-documents-title">
              Attach documents to Step {stepNumber}
            </h2>

            <p>Select one or more documents from the document database.</p>
          </div>

          <button
            className={"modal-close-button"}
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            <X />
          </button>
        </header>

        <div className={"step-documents-toolbar"}>
          <label className={"modal-search-field"}>
            <Search size={19} />

            <input
              type="search"
              value={searchQuery}
              placeholder={"Search documents..."}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
          >
            <option value="all">All document types</option>

            {availableTypes.map((documentType) => (
              <option key={documentType} value={documentType}>
                {documentType}
              </option>
            ))}
          </select>

          <span>{documents.length} documents available</span>
        </div>

        <div className={"step-documents-list"}>
          {isLoading ? (
            <p className="modal-message">Loading documents...</p>
          ) : error ? (
            <p className={"form-error"}>{error}</p>
          ) : filteredDocuments.length === 0 ? (
            <p className="modal-message">No documents found.</p>
          ) : (
            filteredDocuments.map((document) => {
              const isSelected = temporarySelectedIds.includes(document.id);

              return (
                <label
                  className={`modal-document-row ${
                    isSelected ? "selected" : ""
                  }`}
                  key={document.id}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(document.id)}
                  />

                  <div className={"modal-document-info"}>
                    <strong>{document.title}</strong>

                    <small>{document.description || "No description"}</small>
                  </div>

                  <span className={"modal-document-type"}>
                    {document.document_type_label || document.document_type}
                  </span>

                  <span className={"modal-document-source"}>
                    {document.file_url ? (
                      <>
                        <File size={17} />
                        File
                      </>
                    ) : (
                      <>
                        <Link2 size={17} />
                        External link
                      </>
                    )}
                  </span>
                </label>
              );
            })
          )}
        </div>

        <footer className={"step-documents-footer"}>
          <p>{temporarySelectedIds.length} documents selected</p>

          <div>
            <button
              className={"secondary-button"}
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className={"primary-button"}
              type="button"
              onClick={handleAttach}
            >
              Attach selected ({temporarySelectedIds.length})
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};

export default StepDocumentsModal;
