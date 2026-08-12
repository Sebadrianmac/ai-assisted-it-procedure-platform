import { useEffect, useState } from "react";

import "../../styles/CreateRoleForm.css";
import api from "../api/api";

const EditRoleForm = ({
  roleId,
  allPermissions = [],
  onClose,
  onRoleUpdated,
}) => {
  const [roleName, setRoleName] = useState("");
  const [originalRoleName, setOriginalRoleName] =
    useState("");

  const [
    selectedPermissionIds,
    setSelectedPermissionIds,
  ] = useState([]);

  const [
    availablePermissionId,
    setAvailablePermissionId,
  ] = useState("");

  const [
    chosenPermissionId,
    setChosenPermissionId,
  ] = useState("");

  const [formError, setFormError] = useState("");
  const [isLoadingRole, setIsLoadingRole] =
    useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!roleId) {
      return;
    }

    const controller = new AbortController();

    const loadRole = async () => {
      try {
        setIsLoadingRole(true);
        setFormError("");

        const response = await api.get(
          `/api/auth/roles/${roleId}/`,
          {
            signal: controller.signal,
          }
        );

        const loadedRole = response.data;

        setRoleName(loadedRole.name);
        setOriginalRoleName(loadedRole.name);

        const loadedPermissionIds =
          loadedRole.permissions.map(
            (permission) => permission.id
          );

        setSelectedPermissionIds(
          loadedPermissionIds
        );
      } catch (error) {
        if (error.code === "ERR_CANCELED") {
          return;
        }

        const status = error.response?.status;

        if (status === 401) {
          setFormError(
            "You need to log in."
          );
        } else if (status === 403) {
          setFormError(
            "You do not have permission to view this role."
          );
        } else if (status === 404) {
          setFormError("Role not found.");
        } else {
          setFormError(
            "Failed to load role."
          );
        }

        console.error(
          "Failed to load role:",
          error
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingRole(false);
        }
      }
    };

    loadRole();

    return () => {
      controller.abort();
    };
  }, [roleId]);

  const availablePermissions =
    allPermissions.filter(
      (permission) =>
        !selectedPermissionIds.includes(
          permission.id
        )
    );

  const chosenPermissions =
    allPermissions.filter((permission) =>
      selectedPermissionIds.includes(
        permission.id
      )
    );

  const choosePermission = () => {
    const permissionId = Number(
      availablePermissionId
    );

    if (!permissionId) {
      return;
    }

    setSelectedPermissionIds(
      (currentIds) => {
        if (
          currentIds.includes(permissionId)
        ) {
          return currentIds;
        }

        return [
          ...currentIds,
          permissionId,
        ];
      }
    );

    setAvailablePermissionId("");
  };

  const removeChosenPermission = () => {
    const permissionId = Number(
      chosenPermissionId
    );

    if (!permissionId) {
      return;
    }

    setSelectedPermissionIds(
      (currentIds) =>
        currentIds.filter(
          (id) => id !== permissionId
        )
    );

    setChosenPermissionId("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const clearRoleName = roleName.trim();

    if (!clearRoleName) {
      setFormError(
        "Role name is required."
      );
      return;
    }

    try {
      setIsSaving(true);
      setFormError("");

      const response = await api.patch(
        `/api/auth/roles/${roleId}/`,
        {
          role_name: clearRoleName,
          permission_ids:
            selectedPermissionIds,
        }
      );

      onRoleUpdated(response.data);
    } catch (error) {
      const status = error.response?.status;

      if (status === 401) {
        setFormError(
          "You need to log in."
        );
      } else if (status === 403) {
        setFormError(
          "You do not have permission to edit roles."
        );
      } else if (status === 404) {
        setFormError("Role not found.");
      } else {
        const backendError =
          error.response?.data?.error;

        setFormError(
          backendError ||
            "Failed to update role."
        );
      }

      console.error(
        "Failed to update role:",
        error
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingRole) {
    return <p>Loading role...</p>;
  }

  return (
    <section className="create-role-section">
      <form
        className="create-role-form"
        onSubmit={handleSubmit}
      >
        <div className="create-role-header">
          <h2>
            Edit {originalRoleName}
          </h2>

          <button
            type="button"
            className="close-button"
            onClick={onClose}
            disabled={isSaving}
          >
            &times;
          </button>
        </div>

        <div className="role-name-field">
          <label htmlFor="edit-role-name">
            Role name
          </label>

          <input
            id="edit-role-name"
            type="text"
            value={roleName}
            onChange={(event) => {
              setRoleName(
                event.target.value
              );
            }}
            placeholder="Enter role name"
            disabled={isSaving}
          />
        </div>

        <div className="permission-transfer">
          <div className="permission-column">
            <label htmlFor="edit-available-permissions">
              Available permissions
            </label>

            <select
              id="edit-available-permissions"
              size={14}
              value={availablePermissionId}
              onChange={(event) => {
                setAvailablePermissionId(
                  event.target.value
                );
              }}
              onDoubleClick={choosePermission}
              disabled={isSaving}
            >
              {availablePermissions.map(
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
          </div>

          <div className="permission-buttons">
            <button
              type="button"
              onClick={choosePermission}
              disabled={
                !availablePermissionId ||
                isSaving
              }
              title="Add permission"
            >
              &rarr;
            </button>

            <button
              type="button"
              onClick={
                removeChosenPermission
              }
              disabled={
                !chosenPermissionId ||
                isSaving
              }
              title="Remove permission"
            >
              &larr;
            </button>
          </div>

          <div className="permission-column">
            <label htmlFor="edit-chosen-permissions">
              Chosen permissions
            </label>

            <select
              id="edit-chosen-permissions"
              size={14}
              value={chosenPermissionId}
              onChange={(event) => {
                setChosenPermissionId(
                  event.target.value
                );
              }}
              onDoubleClick={
                removeChosenPermission
              }
              disabled={isSaving}
            >
              {chosenPermissions.map(
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
          </div>
        </div>

        {formError && (
          <p className="form-error">
            {formError}
          </p>
        )}

        <div className="create-role-actions">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              isSaving || !roleName.trim()
            }
          >
            {isSaving
              ? "Saving..."
              : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default EditRoleForm;