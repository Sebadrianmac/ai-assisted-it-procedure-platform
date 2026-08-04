import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import ProceduresPage from "./pages/ProceduresPage";
import ProcedureCreate from "./pages/ProcedureCreate";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./pages/components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";

function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] =
    useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const restoreUser = async () => {
      let access =
        localStorage.getItem("access");

      const refresh =
        localStorage.getItem("refresh");

      if (!access || !refresh) {
        setIsAuthLoading(false);
        return;
      }

      try {
        let response = await fetch(
          "http://127.0.0.1:8000/api/auth/me/",
          {
            headers: {
              Authorization: `Bearer ${access}`,
            },
          }
        );

        if (response.status === 401) {
          const refreshResponse = await fetch(
            "http://127.0.0.1:8000/api/auth/token/refresh/",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                refresh,
              }),
            }
          );

          if (!refreshResponse.ok) {
            throw new Error(
              "Refresh token is invalid"
            );
          }

          const tokenData =
            await refreshResponse.json();

          access = tokenData.access;

          localStorage.setItem(
            "access",
            access
          );

          response = await fetch(
            "http://127.0.0.1:8000/api/auth/me/",
            {
              headers: {
                Authorization: `Bearer ${access}`,
              },
            }
          );
        }

        if (!response.ok) {
          throw new Error(
            "Cannot restore user"
          );
        }

        const userData =
          await response.json();

        setUser(userData);
      } catch (error) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    restoreUser();
  }, []);

  const handleLogin = (loggedUser) => {
    setUser(loggedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    setUser(null);
    navigate("/");
  };

  if (isAuthLoading) {
    return <p>Checking authentication...</p>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LoginPage onLogin={handleLogin} />
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout
              user={user}
              permissions={
                user?.permissions || []
              }
              onLogout={handleLogout}
            />
          </ProtectedRoute>
        }
      >
        <Route
          path="/procedures"
          element={
            <ProceduresPage
              permissions={
                user?.permissions || []
              }
            />
          }
        />

        <Route
          path="/procedure/create"
          element={
            <ProcedureCreate
                user={user}
                permissions={
                    user?.permissions || []
                }
            />
          }
        />

        <Route
          path="/profile"
          element={
            <ProfilePage user={user} />
          }
        />

        <Route
          path="/tasks"
          element={<p>Tasks page</p>}
        />

        <Route
          path="/ai-create"
          element={<p>AI Create page</p>}
        />
      </Route>

      <Route
        path="*"
        element={
          <Navigate to="/" replace />
        }
      />
    </Routes>
  );
}

export default App;