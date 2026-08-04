import { useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import {
  ACCESS_TOKEN,
  REFRESH_TOKEN,
} from "./api/constants";

import LoginPage from "./pages/LoginPage";
import ProceduresPage from "./pages/ProceduresPage";
import ProcedureCreate from "./pages/ProcedureCreate";
import ProfilePage from "./pages/ProfilePage";

import ProtectedRoute from "./pages/components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";


function App() {
  const [user, setUser] = useState(null);

  const navigate = useNavigate();


  const handleLogin = (loggedUser) => {
    setUser(loggedUser);
  };


  const handleLogout = () => {
    localStorage.removeItem(
      ACCESS_TOKEN
    );

    localStorage.removeItem(
      REFRESH_TOKEN
    );

    setUser(null);
    navigate("/");
  };


  return (
    <Routes>
      <Route
        path="/"
        element={
          <LoginPage
            onLogin={handleLogin}
          />
        }
      />

      <Route
        element={
          <ProtectedRoute
            onUserLoaded={setUser}
          >
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
          element={<ProcedureCreate />}
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
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}


export default App;