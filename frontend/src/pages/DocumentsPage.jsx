import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Link2, Plus, Upload } from "lucide-react";
import "../../styles/DocumentsPage.css";
import DocumentFormModal from "./components/DocumentFormModal";
import api from "../api/api";
import DocumentTable from "../documents/DocumentTable";

const PAGE_SIZE = 4;

export default function DocumentsPage({ permissions = [] }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("updated_desc");
  
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const canAdd = permissions.includes("procedures.add_document");
  const canDelete = permissions.includes("procedures.delete_document");
  const canUpdate = permissions.includes("procedures.change_document");

  const loadDocuments = useCallback(async (signal) => {
    try {
      setIsLoading(true);
      setLoadError("");
      const response = await api.get("/api/procedures/documents/", { signal });
      setDocuments(response.data);
    } catch (error) {
      if (error.code === "ERR_CANCELED") return;
      const status = error.response?.status;
      setLoadError(
        status === 403
          ? "You do not have permission to view documents."
          : status === 401
            ? "You need to log in."
            : "Failed to load documents.",
      );
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDocuments(controller.signal);
    return () => controller.abort();
  }, [loadDocuments]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...documents]
      .filter((document) => type === "all" || document.document_type === type)
      .filter(
        (document) =>
          !query ||
          [
            document.title,
            document.description,
            document.document_type_label,
          ].some((value) => value?.toLowerCase().includes(query)),
      )
      .sort((a, b) => {
        const direction = sort.endsWith("asc") ? 1 : -1;
        const field = sort.startsWith("created") ? "created_at" : "updated_at";
        return (new Date(a[field]) - new Date(b[field])) * direction;
      });
  }, [documents, search, type, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleDocuments = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => setPage(1), [search, type, sort]);
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const stats = [
    {
      label: "Total documents",
      value: documents.length,
      icon: FileText,
      tone: "blue",
    },
    {
      label: "Uploaded files",
      value: documents.filter((item) => item.file_url).length,
      icon: Upload,
      tone: "green",
    },
    {
      label: "External links",
      value: documents.filter((item) => item.external_url).length,
      icon: Link2,
      tone: "purple",
    },
  ];
  const updateDocument = async (documentId, formData) => {
    const response = await api.patch(
      `/api/procedures/documents/${documentId}/`,
      formData,
    );

    setDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.id === response.data.id ? response.data : document,
      ),
    );

    setEditingDocument(null);
  };
  const deleteDocument = async (documentId) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      await api.delete(`/api/procedures/documents/${documentId}/`);
      setDocuments((current) =>
        current.filter((item) => item.id !== documentId),
      );
    } catch (error) {
      window.alert(
        error.response?.data?.detail || "Failed to delete document.",
      );
    }
  };

  return (
    <main className="documents-page">
      <header className="documents-header">
        <div>
          <h1>Documents</h1>
          <p>Manage documents stored in the database</p>
        </div>
        {canAdd && (
          <button
            className="primary-button"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus size={21} /> Add document
          </button>
        )}
      </header>

      <section className="document-stats">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <article className="stat-card" key={label}>
            <span className={`stat-icon ${tone}`}>
              <Icon />
            </span>
            <div>
              <p>{label}</p>
              <strong className={tone}>{value}</strong>
            </div>
          </article>
        ))}
      </section>

      {loadError && <div className="document-alert">{loadError}</div>}
      <DocumentTable
        documents={visibleDocuments}
        isLoading={isLoading}
        search={search}
        onSearch={setSearch}
        type={type}
        onType={setType}
        sort={sort}
        onSort={setSort}
        page={page}
        pageCount={pageCount}
        total={filtered.length}
        pageSize={PAGE_SIZE}
        onPage={setPage}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onEdit={(document) => setEditingDocument(document)}
        onDelete={deleteDocument}
      />

      {isFormOpen && (
        <DocumentFormModal
          onClose={() => setIsFormOpen(false)}
          onCreated={(createdDocument) => {
            setDocuments((currentDocuments) => [
              createdDocument,
              ...currentDocuments,
            ]);

            setIsFormOpen(false);
          }}
        />
      )}

      {editingDocument && (
        <DocumentFormModal
          document={editingDocument}
          onClose={() => setEditingDocument(null)}
          onUpdated={(updatedDocument) => {
            setDocuments((currentDocuments) =>
              currentDocuments.map((document) =>
                document.id === updatedDocument.id ? updatedDocument : document,
              ),
            );

            setEditingDocument(null);
          }}
        />
      )}
    </main>
  );
}
