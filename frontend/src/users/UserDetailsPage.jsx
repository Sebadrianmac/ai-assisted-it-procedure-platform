import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import api from "../api/api";
import Can from "../pages/components/Can";
import "../../styles/PageToolbar.css";

const UserDetailsPage = ({ permissions = [] }) => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] =useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const controller = new AbortController();

    const loadUser = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api.get(`/api/auth/users/${userId}/`, {
          signal: controller.signal,
        });

        setUser(response.data);
      } catch (error) {
        if (error.code === "ERR_CANCELED") {
          return;
        }

        const status = error.response?.status;

        if (status === 401) {
          setError("You need to log in.");
        } else if (status === 403) {
          setError("You do not have permission " + "to view this user.");
        } else if (status === 404) {
          setError("User was not found.");
        } else {
          setError("Failed to load user.");
        }

        console.error("Failed to load user:", error);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      controller.abort();
    };
  }, [userId]);

  if (isLoading) {
    return <p>Loading user...</p>;
  }

  if (error) {
    return (
      <section>
        <p>{error}</p>

        <Link 
        to="/users"
        className="page-primary-action"
        >Back to users</Link>
      </section>
    );
  }

  if (!user) {
    return <p>User not found.</p>;
  }
  const handleDelete = async (e) => {
      const confirmed = window.confirm(
      `Delete user "${user.username}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      setError("");

      await api.delete(
        `/api/auth/users/${user.id}/`
      );

      navigate("/users/");
    } catch (error) {
      console.error(
        "Failed to delete user:",
        error
      );

      const status =
        error.response?.status;

      const backendData =
        error.response?.data;

      if (status === 403) {
        setError(
          "You do not have permission "
          + "to delete users."
        );
      } else if (status === 409) {
        setError(
          backendData?.error ||
          "This user cannot be deleted "
          + "because they created procedures."
        );
      } else {
        setError(
          backendData?.error ||
          "Failed to delete user."
        );
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="user-details-page">
      <header>
        <div className="page-toolbar">
        <Link 
        to="/users"
        className="page-primary-action"
        >← Back to users</Link>
        </div>
        <h1>{user.username}</h1>
        <p>User account information</p>
      </header>

      <section className="user-details">
        <dl>
          <div>
            <dt>User ID</dt>
            <dd>{user.id}</dd>
          </div>

          <div>
            <dt>Username</dt>
            <dd>{user.username}</dd>
          </div>

          <div>
            <dt>First name</dt>
            <dd>{user.first_name || "—"}</dd>
          </div>

          <div>
            <dt>Last name</dt>
            <dd>{user.last_name || "—"}</dd>
          </div>

          <div>
            <dt>Email</dt>
            <dd>{user.email || "—"}</dd>
          </div>

          <div>
            <dt>Status</dt>
            <dd>{user.is_active ? "Active" : "Inactive"}</dd>
          </div>

          <div>
            <dt>Roles</dt>
            <dd>
              {user.roles?.length > 0
                ? user.roles.join(", ")
                : "No roles assigned"}
            </dd>
          </div>

          <div>
            <dt>Date joined</dt>
            <dd>
              {user.date_joined
                ? new Date(user.date_joined).toLocaleDateString()
                : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="user-actions">
        <Can permission="users.change_user" permissions={permissions}>
          <Link to={`/users/edit/${user.id}/`}>Edit user</Link>
        </Can>

        <Can permission="users.delete_user" permissions={permissions}>
          <button type="button" onClick={handleDelete}>Delete user</button>
        </Can>
      </section>
    </main>
  );
};

export default UserDetailsPage;
