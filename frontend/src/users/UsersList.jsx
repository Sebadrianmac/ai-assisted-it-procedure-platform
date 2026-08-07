import { Link } from "react-router-dom";

import Can from "../pages/components/Can";
import "../../styles/UsersList.css";


const UsersList = ({
  users = [],
  filteredUsers = [],
  onDeleteButtonClick,
  permissions = [],
  onBlockButtonClick,
}) => {
  const hasUsers =
    users.length > 0;

  const usersNotFound =
    hasUsers &&
    filteredUsers.length === 0;

  if (!hasUsers) {
    return (
      <div className="users-empty-message">
        There are no users yet.
      </div>
    );
  }

  if (usersNotFound) {
    return (
      <div className="users-empty-message">
        Users not found.
      </div>
    );
  }

  return (
    <div className="users-table-wrapper">
      <table className="users-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Full name</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>

              <td>
                {user.first_name ||
                user.last_name
                  ? `${user.first_name} ${user.last_name}`.trim()
                  : "—"}
              </td>

              <td>
                {user.email || "—"}
              </td>

              <td>
                {user.roles?.length > 0
                  ? user.roles.join(", ")
                  : "No role"}
              </td>

              <td>
                <span
                  className={
                    user.is_active
                      ? "user-status user-status--active"
                      : "user-status user-status--inactive"
                  }
                >
                  {user.is_active
                    ? "Active"
                    : "Inactive"}
                </span>
              </td>

              <td className="users-actions">
              <Can
                permission="users.view_user"
                permissions={permissions}
              >
                <Link
                  className="action-button"
                  to={`/users/${user.id}`}
                >
                  View
                </Link>
              </Can>

              <Can
                permission="users.change_user"
                permissions={permissions}
              >
                <Link
                  className="action-button"
                  to={`/users/edit/${user.id}/`}
                >
                  Edit
                </Link>
              </Can>

              <Can
                permission="users.change_user"
                permissions={permissions}
              >
                <button
                  className="action-button"
                  type="button"
                  onClick={() =>
                    onBlockButtonClick(
                      user.id,
                      !user.is_active
                    )
                  }
                >
                  {user.is_active
                    ? "Deactivate"
                    : "Activate"}
                </button>
              </Can>

              <Can
                permission="users.delete_user"
                permissions={permissions}
              >
                <button
                  className={
                    "action-button "
                    + "action-button--danger"
                  }
                  type="button"
                  onClick={() =>
                    onDeleteButtonClick(user.id)
                  }
                >
                  Delete
                </button>
              </Can>
            </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


export default UsersList;