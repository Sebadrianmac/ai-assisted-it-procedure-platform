import { useState } from "react";
import "../../styles/CreateRoleForm.css";
import api from "../api/api";

const CreateRoleForm = ({
  roles = [],
  allPermissions = [],
  onClose,
  onRoleCreated,
}) => {
  const [newRoleName, setNewRoleName] = useState("");
  const [templateRoleId, setTemplateRoleId] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
  const [availablePermissionId, setAvailablePermissionId] = useState("");
  const [chosenPermissionId, setChosenPermissionId] = useState("");
  const [formError, setFormError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const availablePermissions = allPermissions.filter(
    (permission) => !selectedPermissionIds.includes(permission.id),
  );

  const chosenPermissions = allPermissions.filter((permission) =>
    selectedPermissionIds.includes(permission.id),
  );

  const handleTemplateRoleChange = (event) => {
    const selectedTemplateRoleId = event.target.value;

    setTemplateRoleId(selectedTemplateRoleId);

    if (!selectedTemplateRoleId) {
      setSelectedPermissionIds([]);
      setAvailablePermissionId("");
      setChosenPermissionId("");
      return;
    }

    const templateRole = roles.find(
      (role) => role.id === Number(selectedTemplateRoleId),
    );

    if (!templateRole) {
      setSelectedPermissionIds([]);
      return;
    }

    const templatePermissionIds = templateRole.permissions.map(
      (permission) => permission.id,
    );

    setSelectedPermissionIds(templatePermissionIds);

    setAvailablePermissionId("");
    setChosenPermissionId("");
  };

  const choosePermission = () => {
    const permissionId = Number(availablePermissionId);

    if (!permissionId) {
      return;
    }

    setSelectedPermissionIds((currentIds) => {
      if (currentIds.includes(permissionId)) {
        return currentIds;
      }

      return [...currentIds, permissionId];
    });

    setAvailablePermissionId("");
  };

  const removeChosenPermission = () => {
    const permissionId = Number(chosenPermissionId);

    if (!permissionId) {
      return;
    }

    setSelectedPermissionIds((currentIds) =>
      currentIds.filter((id) => id !== permissionId),
    );

    setChosenPermissionId("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const clearRoleName = newRoleName.trim();

    if (!clearRoleName) {
      setFormError("Role name is required.");
      return;
    }

    try {
      setIsCreating(true);
      setFormError("");

      const response = await api.post("/api/auth/roles/", {
        role_name: clearRoleName,
        permission_ids: selectedPermissionIds,
      });

      onRoleCreated(response.data);
    } catch (error) {
      const status = error.response?.status;

      if (status === 401) {
        setFormError("You need to log in.");
      } else if (status === 403) {
        setFormError("You do not have permission to create roles.");
      } else {
        const backendError = error.response?.data?.error;

        setFormError(backendError || "Failed to create role.");
      }

      console.error("Failed to create role:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="create-role-section">
      <form className="create-role-form" onSubmit={handleSubmit}>
        <div className="create-role-header">
          <h2>Create new role</h2>

          <button
            type="button"
            className="close-button"
            onClick={onClose}
            disabled={isCreating}
          >
            &times;
          </button>
        </div>

        <div className="role-name-field">
          <label htmlFor="new-role-name">Role name</label>

          <input
            id="new-role-name"
            type="text"
            value={newRoleName}
            onChange={(event) => {
              setNewRoleName(event.target.value);
            }}
            placeholder="Enter role name"
            disabled={isCreating}
          />
        </div>

        <div className="template-role-field">
          <label htmlFor="template-role">Copy permissions from</label>

          <select
            id="template-role"
            value={templateRoleId}
            onChange={handleTemplateRoleChange}
            disabled={isCreating}
          >
            <option value="">Start without permissions</option>

            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className="permission-transfer">
          <div className="permission-column">
            <label htmlFor="available-permissions">Available permissions</label>

            <select
              id="available-permissions"
              size={14}
              value={availablePermissionId}
              onChange={(event) => {
                setAvailablePermissionId(event.target.value);
              }}
              onDoubleClick={choosePermission}
              disabled={isCreating}
            >
              {availablePermissions.map((permission) => (
                <option key={permission.id} value={permission.id}>
                  {permission.name}
                </option>
              ))}
            </select>
          </div>

          <div className="permission-buttons">
            <button
              type="button"
              onClick={choosePermission}
              disabled={!availablePermissionId || isCreating}
              title="Add permission"
            >
              &rarr;
            </button>

            <button
              type="button"
              onClick={removeChosenPermission}
              disabled={!chosenPermissionId || isCreating}
              title="Remove permission"
            >
              &larr;
            </button>
          </div>

          <div className="permission-column">
            <label htmlFor="chosen-permissions">Chosen permissions</label>

            <select
              id="chosen-permissions"
              size={14}
              value={chosenPermissionId}
              onChange={(event) => {
                setChosenPermissionId(event.target.value);
              }}
              onDoubleClick={removeChosenPermission}
              disabled={isCreating}
            >
              {chosenPermissions.map((permission) => (
                <option key={permission.id} value={permission.id}>
                  {permission.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formError && <p className="form-error">{formError}</p>}

        <div className="create-role-actions">
          <button type="button" onClick={onClose} disabled={isCreating}>
            Cancel
          </button>

          <button type="submit" disabled={isCreating || !newRoleName.trim()}>
            {isCreating ? "Creating..." : "Create role"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default CreateRoleForm;
