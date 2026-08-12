import CreateRoleForm from "./CreateRoleForm";

import ViewRole from "./ViewRole";
import EditRoleForm from "./EditRoleForm";
import Can from "../pages/components/Can";
const RolePanel = ({
    mode, 
    setMode,
    permissions = [],
    selectedRole = null,
    visiblePermissions = [],

    roles=[],
    allPermissions=[],
    handleRoleCreated,
    deleteRoleSubmit,
    handleRoleUpdated,

}) => {

    return (
        <>
            {mode === "view" && (
            <Can
                permission="auth.view_group"
                permissions={permissions}
            >
                <ViewRole 
                    permissions={permissions}
                    selectedRole={selectedRole}
                    visiblePermissions={visiblePermissions}
                    onDelete={deleteRoleSubmit}
                />
            </Can>
            )}

            {mode === "add" && (
            <Can
                permission="auth.add_group"
                permissions={permissions}
            >
                <CreateRoleForm
                roles={roles}
                allPermissions={allPermissions}
                onClose={() => setMode("view")}
                onRoleCreated={handleRoleCreated}
                />
            </Can>
            )}
           {mode === "edit" && (
            <Can
            permission="auth.change_group"
            permissions={permissions}
          >
            <EditRoleForm
            roleId={selectedRole.id}
            allPermissions={allPermissions}
            onClose={() => setMode("view")}
            onRoleUpdated={handleRoleUpdated}
            />
            </Can>
           )}
        </>
    );
} 
export default RolePanel