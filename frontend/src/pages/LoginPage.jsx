import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { publicApi } from "../api/api";
import {
  ACCESS_TOKEN,
  REFRESH_TOKEN,
} from "../api/constants";

function LoginPage({onLogin}) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

    const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

   const handleSubmit = async (event) => {
    event.preventDefault();

    if (!login.trim() || !password) {
      setMessage(
        "Login and password are required."
      );
      return;
    }

    try {
      setIsLoading(true);
      setMessage("");

      const response = await publicApi.post(
        "api/auth/login/",
        {
          login: login.trim(),
          password,
        }
      );

      const data = response.data;

      localStorage.setItem(
        ACCESS_TOKEN,
        data.access
      );

      localStorage.setItem(
        REFRESH_TOKEN,
        data.refresh
      );

      onLogin(data.user);

      navigate("/procedures");
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setMessage(
        error.response?.data?.error ||
        "Cannot connect to the server."
      );
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="login">Login</label> <br />
        <input id="login"
          type="text"
          placeholder="Username or email"
          value={login}
          onChange={(event) => setLogin(event.target.value)}
        /> <br /> <br />
      <label htmlFor="password">Password</label> <br />
        <input id="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        /> <br /> <br />

        <button type="submit">Log in</button>
      </form>

      <p>{message}</p>
    </div>
  );
}

export default LoginPage;