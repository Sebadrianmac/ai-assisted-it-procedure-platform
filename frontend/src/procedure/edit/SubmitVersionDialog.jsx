import "../../../styles/procedure/SubmitVersionDialog.css";
const SubmitVersionDialog = ({
  isOpen,
  changeType,
  isSaving,
  onChangeType,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="submit-dialog-backdrop"
      role="presentation"
    >
      <section
        className="submit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-dialog-title"
      >
        <h2 id="submit-dialog-title">
          Select change type
        </h2>

        <p>
          Choose how the next version number
          should change.
        </p>

        <label className="change-type-option">
          <input
            type="radio"
            name="change-type"
            value="minor"
            checked={changeType === "minor"}
            onChange={(event) =>
              onChangeType(event.target.value)
            }
          />

          <span>
            <strong>Minor change</strong>

            <small>
              Corrections and incremental
              updates. For example: 1.2 → 1.3
            </small>
          </span>
        </label>

        <label className="change-type-option">
          <input
            type="radio"
            name="change-type"
            value="major"
            checked={changeType === "major"}
            onChange={(event) =>
              onChangeType(event.target.value)
            }
          />

          <span>
            <strong>Major change</strong>

            <small>
              Significant workflow or technology
              change. For example: 1.2 → 2.0
            </small>
          </span>
        </label>

        <div className="submit-dialog-actions">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={isSaving}
          >
            {isSaving
              ? "Submitting..."
              : "Submit"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default SubmitVersionDialog;