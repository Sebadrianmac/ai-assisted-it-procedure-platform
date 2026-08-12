import "../../styles/RolePage.css";
import Can from "../pages/components/Can";

const ViewRole = ({
    permissions= [],
    selectedRole = null, 
    visiblePermissions= [],
    onDelete,
}) => {

    return (
        <>
        <div className="role-panel-header">
        <h2>
            {selectedRole
            ? selectedRole.name
            : "All permissions"}
        </h2>

            </div>
         <label htmlFor="permission-select">
                {selectedRole
                  ? `${selectedRole.name} permissions`
                  : "All permissions"}
              </label>

              <select
                id="permission-select"
                size={15}
              >
                {visiblePermissions.map(
                  (permission) => (
                    <option
                      key={permission.id}
                      value={permission.id}
                    >
                      {permission.name}
                    </option>
                  )
                )}
              </select>
        </>
    )
}
export default ViewRole