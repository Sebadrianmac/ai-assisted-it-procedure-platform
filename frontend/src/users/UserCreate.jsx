import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";

const UserCreate = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleName, setRoleName] = useState("");
  const [roleChoices, setRoleChoices] = useState([])

  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsCreating(true);
      setError("");

      const response = await api.post("/api/auth/users/", {
        username: username.trim(),
        email: email.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        roles: roleName ? [roleName] : [],
      });

      console.log("Created user:", response.data);

      navigate("/users");
    } catch (error) {
      console.error("User creation error:", error);

      const status = error.response?.status;

      const backendData = error.response?.data;

      if (status === 401) {
        setError("Your session has expired.");
      } else if (status === 403) {
        setError("You do not have permission " + "to create users.");
      } else if (status === 400) {
        setError(
          backendData?.username ||
            backendData?.email ||
            backendData?.password ||
            backendData?.roles ||
            backendData?.error ||
            "Invalid user data.",
        );
      } else {
        setError("Failed to create user.");
      }
    } finally {
      setIsCreating(false);
    }
  };

 useEffect(() => {
  const controller =
    new AbortController();

  const loadRoles = async () => {
    try {
      const response = await api.get(
        "/api/auth/roles/",
        {
          signal: controller.signal,
        }
      );

      setRoleChoices(response.data);
    } catch (error) {
      if (
        error.code === "ERR_CANCELED"
      ) {
        return;
      }

      console.error(
        "Failed to load roles:",
        error
      );

      setError(
        "Failed to load roles."
      );
    }
  };

  loadRoles();

  return () => {
    controller.abort();
  };
}, []);

  return (
    <main className="user-create-page">
      <header>
        <h1>Create user</h1>
        <p>Create a new user account</p>
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
          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            value={password}
            required
            onChange={(event) => setPassword(event.target.value)}
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
            <label htmlFor="role">
                Role
            </label>

            <select
                id="role"
                value={roleName}
                onChange={(event) =>
                setRoleName(
                    event.target.value
                )
                }
            >
                <option value="">
                Select role
                </option>

                {roleChoices.map((role) => (
                <option
                    key={role.id}
                    value={role.name}
                >
                    {role.name}
                </option>
                ))}
            </select>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="button" onClick={() => navigate("/users")}>
            Cancel
          </button>

          <button type="submit" disabled={isCreating}>
            {isCreating ? "Creating..." : "Create user"}
          </button>
        </div>
      </form>
    </main>
  );
};

export default UserCreate;
