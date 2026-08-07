import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import api from "../api/api";

const UserEditPage = ({ permissions = [] }) => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleName, setRoleName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [roleChoices, setRoleChoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadPageData = async () => {
      try {
        setIsLoading(true);
        setError("");

        const [userResponse, rolesResponse] = await Promise.all([
          api.get(`/api/auth/users/${userId}/`, {
            signal: controller.signal,
          }),

          api.get("/api/auth/roles/", {
            signal: controller.signal,
          }),
        ]);

        const loadedUser = userResponse.data;

        setUsername(loadedUser.username || "");
        setEmail(loadedUser.email || "");
        setFirstName(loadedUser.first_name || "");
        setLastName(loadedUser.last_name || "");
        setIsActive(loadedUser.is_active);
        setRoleName(loadedUser.roles?.[0] || "");
        setRoleChoices(rolesResponse.data);
      } catch (error) {
        if (error.code === "ERR_CANCELED") {
          return;
        }

        console.error("Failed to load edit page:", error);

        const status = error.response?.status;

        if (status === 403) {
          setError("You do not have permission " + "to edit this user.");
        } else if (status === 404) {
          setError("User was not found.");
        } else {
          setError("Failed to load user.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadPageData();

    return () => {
      controller.abort();
    };
  }, [userId]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError("");

      await api.patch(`/api/auth/users/${userId}/`, {
        username: username.trim(),
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        is_active: isActive,
        roles: roleName ? [roleName] : [],
      });

      navigate(`/users/`);
    } catch (error) {
      console.error("Failed to update user:", error);

      const status = error.response?.status;

      const backendData = error.response?.data;

      if (status === 401) {
        setError("Your session has expired.");
      } else if (status === 403) {
        setError("You do not have permission " + "to edit users.");
      } else if (status === 400) {
        setError(
          backendData?.username ||
            backendData?.email ||
            backendData?.roles ||
            backendData?.error ||
            "Invalid user data.",
        );
      } else {
        setError("Failed to update user.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p>Loading user...</p>;
  }

  if (error && !username) {
    return (
      <main>
        <p className="form-error">{error}</p>

        <button type="button" onClick={() => navigate("/users")}>
          Back to users
        </button>
      </main>
    );
  }

  return (
    <main className="user-edit-page">
      <header>
        <h1>Edit user</h1>
        <p>Update {username}'s account</p>
      </header>

      <form className="user-create-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="username">Username</label>

          <input
            id="username"
            type="text"
            value={username}
            required
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="email">Email</label>

          <input
            id="email"
            type="email"
            value={email}
            required
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="first-name">First name</label>

          <input
            id="first-name"
            type="text"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="last-name">Last name</label>

          <input
            id="last-name"
            type="text"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="role">Role</label>

          <select
            id="role"
            value={roleName}
            onChange={(event) => setRoleName(event.target.value)}
          >
            <option value="">No role</option>

            {roleChoices.map((role) => (
              <option key={role.id} value={role.name}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            Active account
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
           <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </button>
          <button type="button" onClick={() => navigate(`/users/`)}>
            Cancel
          </button>

         
        </div>
      </form>
    </main>
  );
};

export default UserEditPage;
