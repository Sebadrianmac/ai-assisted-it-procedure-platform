import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage({onLogin}) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();

    const response = await fetch(
      "http://127.0.0.1:8000/api/auth/login/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login: login,
          password: password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Login failed");
      return;
    }

    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);

    onLogin(data.user)

    navigate("/procedures");
  }

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