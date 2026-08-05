import api from "../api/api";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";

import UsersList from "../users/UsersList";
import SearchInput from "./components/SearchInput";
import Can from "./components/Can";
import "../../styles/Users.css"
import "../../styles/PageToolbar.css";

const UsersPage = ({ permissions = [] }) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadUsers = useCallback(async (signal) => {
    try {
      setIsLoading(true);
      setError("");

      const response = await api.get("/api/auth/users/", {
        signal,
      });

      setUsers(response.data);
    } catch (error) {
      if (error.code === "ERR_CANCELED") {
        return;
      }

      const status = error.response?.status;

      if (status === 401) {
        setError("You need to log in.");
      } else if (status === 403) {
        setError("You do not have permission to view users.");
      } else {
        setError("Failed to load users.");
      }

      console.error("Failed to load users:", error);
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadUsers(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadUsers]);

  const deleteUser = async (id) => {
    try {
      await api.delete(`/api/auth/users/${id}/`);
      setUsers((currentUsers) =>
        currentUsers.filter((user) => user.id !== id)
      );
    } catch (error) {
      console.error("Failed to delete user:", error);
      setError("Failed to delete user.");
    }
  };
  const changeUserStatus = async (
    id,
    newIsActive
  ) => {
    try {
      const response = await api.patch(
        `/api/auth/users/${id}/`,
        {
          is_active: newIsActive,
        }
      );

      const updatedUser = response.data;

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === id
            ? updatedUser
            : user
        )
      );
    } catch (error) {
      console.error(
        "Failed to change user status:",
        error.response?.data ?? error
      );

      setError(
        error.response?.data?.error ??
        "Failed to change user status."
      );
    }
  };
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      const username = user.username?.toLowerCase() ?? "";
      const email = user.email?.toLowerCase() ?? "";
      const firstName = user.first_name?.toLowerCase() ?? "";
      const lastName = user.last_name?.toLowerCase() ?? "";

      return (
        username.includes(query) ||
        email.includes(query) ||
        firstName.includes(query) ||
        lastName.includes(query)
      );
    });
  }, [searchQuery, users]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

return (
  <main className="users-page">
    <header>
      <h1>Users</h1>
    </header>

    <div className="page-toolbar">
      <SearchInput
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Search users..."
      />

      <Can
        permission="users.add_user"
        permissions={permissions}
      >
        <Link
          className="page-primary-action"
          to="/users/create"
        >
          Create user
        </Link>
      </Can>
    </div>

    <UsersList
      users={users}
      filteredUsers={filteredUsers}
      onDeleteButtonClick={
        deleteUser
      }
      onBlockButtonClick={
        changeUserStatus
      }
      permissions={permissions}
    />
  </main>
);
}
export default UsersPage