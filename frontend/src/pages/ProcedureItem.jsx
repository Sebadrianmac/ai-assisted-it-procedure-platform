import Can from "./components/Can";

const ProcedureItem = ({
  procedure,
  permissions,
}) => {
  return (
    <tr>
      <td>
        <strong>{procedure.title}</strong>
        <p>{procedure.description || "—"}</p>
      </td>

      <td>
        {procedure.created_by.username || "—"}
      </td>

      <td>{procedure.created_at}</td>


      <td>
        <Can
          permission="procedures.view_procedure"
          permissions={permissions}
        >
          <button type="button">
            View details
          </button>
        </Can>

        <Can
          permission="procedures.change_procedure"
          permissions={permissions}
        >
          <button type="button">
            Edit
          </button>
        </Can>

        <Can
          permission="procedures.delete_procedure"
          permissions={permissions}
        >
          <button type="button">
            Delete
          </button>
        </Can>
      </td>
    </tr>
  );
};



export default ProcedureItem;