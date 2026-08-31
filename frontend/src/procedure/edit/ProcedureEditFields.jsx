import "../../../styles/procedure/ProcedureFields.css";
const ProcedureEditFields = ({
  title,
  description,
  disabled,
  onTitleChange,
  onDescriptionChange,
}) => {
  return (
    <>
      <div className="edit-form-group">
        <label htmlFor="title">
          Title
        </label>

        <input
          type="text"
          id="title"
          value={title}
          onChange={(event) =>
            onTitleChange(event.target.value)
          }
          placeholder="Enter procedure title"
          disabled={disabled}
          required
        />
      </div>

      <div className="edit-form-group">
        <label htmlFor="description">
          Description
        </label>

        <textarea
          id="description"
          value={description}
          onChange={(event) =>
            onDescriptionChange(
              event.target.value,
            )
          }
          placeholder="Enter procedure description"
          disabled={disabled}
          rows={5}
        />
      </div>
    </>
  );
};

export default ProcedureEditFields;