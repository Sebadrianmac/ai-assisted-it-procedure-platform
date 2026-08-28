import {
  ExternalLink,
  Eye,
  File,
  FileText,
  Info,
  Link2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "—";

export default function DocumentItem({
  document,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const url = document.file_url || document.external_url;

  const author =
    [document.uploaded_by?.first_name, document.uploaded_by?.last_name]
      .filter(Boolean)
      .join(" ") ||
    document.uploaded_by?.username ||
    "—";

  const extension = document.file_url?.split(".").pop()?.toUpperCase();

  useEffect(() => {
    const close = (event) =>
      !menuRef.current?.contains(event.target) && setOpen(false);
    window.document.addEventListener("mousedown", close);
    return () => window.document.removeEventListener("mousedown", close);
  }, []);

  return (
    <tr>
      <td>
        <div className="document-main">
          <span
            className={`file-badge ${document.external_url ? "link" : "file"}`}
          >
            {document.external_url ? (
              <Link2 />
            ) : (
              <>
                <FileText />
                <small>{extension || "FILE"}</small>
              </>
            )}
          </span>
          <div>
            <strong>{document.title}</strong>
            <p>{document.description || "No description"}</p>
          </div>
        </div>
      </td>
      <td>{document.document_type_label || document.document_type}</td>
      <td>
        <span className="source-label">
          {document.file_url ? <File /> : <Link2 />}
          {document.file_url ? "File" : "External link"}
        </span>
      </td>
      <td>{author}</td>
      <td>{formatDate(document.created_at)}</td>
      <td>{formatDate(document.updated_at)}</td>
      <td className="actions-cell">
        <div className="action-wrap" ref={menuRef}>
          <button className="icon-button" onClick={() => setOpen(!open)}>
            <MoreVertical />
          </button>
          {open && (
            <div className="action-menu">
              <a href={url} target="_blank" rel="noreferrer">
                <Eye /> Open document
              </a>
              {canUpdate && (
                <button
                  type="button"
                  onClick={() => {
                    onEdit(document);
                    setOpen(false);
                  }}
                >
                  <Pencil />
                  Edit
                </button>
              )}
              {canDelete && (
                <button
                  className="danger"
                  onClick={() => onDelete(document.id)}
                >
                  <Trash2 /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
