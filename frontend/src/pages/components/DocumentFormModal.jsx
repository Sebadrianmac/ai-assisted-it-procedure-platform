import { useEffect, useState } from "react";

import { Link2, Upload, X } from "lucide-react";

import api from "../../api/api";

export default function DocumentFormModal({
  document = null,
  onClose,
  onCreated,
  onUpdated,
}) {
  const isEditing = document !== null;
  const [source, setSource] = useState(
    document?.external_url ? "link" : "file",
  );
  const [title, setTitle] = useState(document?.title || "");
  const [documentType, setDocumentType] = useState(
    document?.document_type || "policy",
  );
  const [description, setDescription] = useState(document?.description || "");
  const [externalUrl, setExternalUrl] = useState(document?.external_url || "");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(document?.title || "");

    setDocumentType(document?.document_type || "policy");

    setDescription(document?.description || "");

    setExternalUrl(document?.external_url || "");

    setSource(document?.external_url ? "link" : "file");

    setFile(null);
    setError("");
  }, [document]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData();

    formData.append("title", title);
    formData.append("document_type", documentType);
    formData.append("description", description);
    if (source === "link") {
      formData.append("external_url", externalUrl);
    }
    if (source === "file" && file) {
      formData.append("file", file);
    }

    try {
      setSaving(true);
      setError("");

      if (isEditing) {
        const response = await api.patch(
          `/api/procedures/documents/${document.id}/`,
          formData,
        );

        onUpdated(response.data);
      } else {
        const response = await api.post("/api/procedures/documents/", formData);

        onCreated(response.data);
      }
    } catch (requestError) {
      const responseData = requestError.response?.data;
      const firstError = responseData ? Object.values(responseData)[0] : null;

      setError(
        responseData?.detail ||
          responseData?.document ||
          firstError ||
          "Failed to save document.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="document-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <h2>{isEditing ? "Edit document" : "Add document"}</h2>
            <p>
              {isEditing
                ? "Update document information."
                : "Upload a file or save an external reference."}
            </p>
          </div>

          <button
            className="icon-button"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            <X />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <label>
            Title
            <input
              required
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label>
            Document type
            <select
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
            >
              <option value="policy">Policy</option>
              <option value="standard">Standard</option>
              <option value="contract">Contract</option>
              <option value="regulation">Regulation</option>
              <option value="internal">Internal</option>
            </select>
          </label>

          <label>
            Description
            <textarea
              rows="3"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <div className="source-tabs">
            <button
              className={source === "file" ? "active" : ""}
              type="button"
              onClick={() => setSource("file")}
            >
              <Upload size={18} />
              File
            </button>

            <button
              className={source === "link" ? "active" : ""}
              type="button"
              onClick={() => setSource("link")}
            >
              <Link2 size={18} />
              External link
            </button>
          </div>

          {source === "file" ? (
            <label className="file-input">
              File
              <input
                type="file"
                required={!isEditing}
                onChange={(event) => setFile(event.target.files[0] || null)}
              />
              {isEditing && document.file_url && !file && (
                <span>Current file will be kept.</span>
              )}
              {file && <span>New file: {file.name}</span>}
            </label>
          ) : (
            <label>
              External URL
              <input
                required
                type="url"
                placeholder="https://..."
                value={externalUrl}
                onChange={(event) => setExternalUrl(event.target.value)}
              />
            </label>
          )}

          {error && <p className="form-error">{String(error)}</p>}

          <footer>
            <button
              className="secondary-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button className="primary-button" type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Add document"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
