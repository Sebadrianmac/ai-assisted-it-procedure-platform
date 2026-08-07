import { useCallback, useEffect, useState } from "react";
import api from "../api/api";
import "../../styles/RolePage.css";
import Can from "./components/Can";
import CreateRoleForm from "./roles/CreateRoleForm";
import RolePanel from "./roles/RolePanel";

const RolePage = ({ permissions = [] }) => {
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState("view");
  const loadRoles = useCallback(async (signal) => {
    try {
      setIsLoading(true);
      setLoadError("");

      const response = await api.get("/api/auth/roles/", {
        signal,
      });

      setRoles(response.data);
    } catch (error) {
      if (error.code === "ERR_CANCELED") {
        return;
      }

      const status = error.response?.status;

      if (status === 401) {
        setLoadError("You need to log in.");
      } else if (status === 403) {
        setLoadError(
          "You do not have permission to view roles."
        );
      } else {
        setLoadError("Failed to load roles.");
      }

      console.error("Failed to load roles:", error);
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadRoles(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadRoles]);

    const deleteRoleSubmit = async (role) => {
    if (!role) {
      return;
    }

    const confirmed = window.confirm(
      `Delete role "${role.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/api/auth/roles/${role.id}/`
      );

      setRoles((currentRoles) =>
        currentRoles.filter(
          (currentRole) =>
            currentRole.id !== role.id
        )
      );

      setSelectedRoleId("");
      setMode("view");
    }catch(error){

    }
  }
  const allPermissions = [];

  roles.forEach((role) => {
    role.permissions.forEach((permission) => {
      const alreadyAdded = allPermissions.some(
        (existingPermission) =>
          existingPermission.id === permission.id
      );

      if (!alreadyAdded) {
        allPermissions.push(permission);
      }
    });
  });

  const selectedRole = roles.find(
    (role) => role.id === Number(selectedRoleId)
  );

  const visiblePermissions = selectedRole
    ? selectedRole.permissions
    : allPermissions;

  const handleRoleCreated = (newRole) => {
    setRoles((currentRoles) => {
      const updatedRoles = [
        ...currentRoles,
        newRole,
      ];

      return updatedRoles.sort(
        (firstRole, secondRole) =>
          firstRole.name.localeCompare(
            secondRole.name
          )
      );
    });

    setSelectedRoleId(String(newRole.id));
    setMode("view");
    };
    const handleRoleUpdated = (updatedRole) => {
    setRoles((currentRoles) =>
      currentRoles
        .map((role) =>
          role.id === updatedRole.id
            ? updatedRole
            : role
        )
        .sort((firstRole, secondRole) =>
          firstRole.name.localeCompare(
            secondRole.name
          )
        )
    );

    setSelectedRoleId(
      String(updatedRole.id)
    );

    setMode("view");
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (loadError) {
    return <p>{loadError}</p>;
  }

  return (
  <main className="role-page">
    <header className="role-page-header">
      <div>
        <h1>Roles and permissions</h1>

        <p>
          Create roles and manage their permissions.
        </p>
      </div>
    </header>

    <div className="role-container">
      <aside className="role-names">
        <label htmlFor="role-select">
          Roles
        </label>

        <select
          id="role-select"
          size={8}
          value={selectedRoleId}
          onChange={(event) => {
            setSelectedRoleId(event.target.value);

            if (mode !== "view") {
              setMode("view");
            }
          }}
        >
          <option value="">
            All roles
          </option>

          {roles.map((role) => (
            <option
              key={role.id}
              value={role.id}
            >
              {role.name}
            </option>
          ))}
        </select>

        <div className="role-actions">
          <Can
            permission="auth.add_group"
            permissions={permissions}
          >
            <button
              type="button"
              className="add-role-button"
              onClick={() => {
                setMode("add");
              }}
              disabled={mode === "add"}
            >
              Add role
            </button>
          </Can>

          <Can
            permission="auth.change_group"
            permissions={permissions}
          >
            <button
              type="button"
              className="change-role-button"
              onClick={() => {
                if (!selectedRole) {
                  return;
                }

                setMode("edit");
              }}
              disabled={
                !selectedRole || mode === "edit"
              }
            >
              Edit role
            </button>
          </Can>

          <Can
            permission="auth.delete_group"
            permissions={permissions}
          >
            <button
              type="button"
              className="delete-role-button"
              onClick={() => {
                if (!selectedRole) {
                  return;
                }

                deleteRoleSubmit(selectedRole);
              }}
              disabled={
                !selectedRole || mode !== "view"
              }
            >
              Delete role
            </button>
          </Can>
        </div>
      </aside>

      <section className="roles-permission">
      <RolePanel
        mode={mode}
        setMode={setMode}
        permissions={permissions}
        selectedRole={selectedRole}
        visiblePermissions={visiblePermissions}
        roles={roles}
        allPermissions={allPermissions}
        handleRoleCreated={handleRoleCreated}
        handleRoleUpdated={handleRoleUpdated}
      />
      </section>
    </div>
  </main>
)};
export default RolePage