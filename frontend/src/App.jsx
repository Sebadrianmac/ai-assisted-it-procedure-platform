import { useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { ACCESS_TOKEN, REFRESH_TOKEN } from "./api/constants";
import MainLayout from "./layouts/MainLayout";
import DocumentsPage from "./pages/DocumentsPage";
import LoginPage from "./pages/LoginPage";
import ProceduresPage from "./pages/ProceduresPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./pages/components/ProtectedRoute";
import ReviewProcedurePage from "./pages/ReviewProcedurePage";
import RolePage from "./pages/RolePage";
import UsersPage from "./pages/UsersPage";
import EditProcedurePage from "./procedure/EditProcedurePage";
import ProcedureDetailsPage from "./procedure/ProcedureDetailsPage";
import ReviewItemDetail from "./procedure/ReviewItemDetail";
import UserCreate from "./users/UserCreate";
import UserDetailsPage from "./users/UserDetailsPage";
import UserEditPage from "./users/UserEditPage";
import TaskPage from "./pages/TaskPage";
import ExecutionCreate from "./tasks/ExecutionCreate";

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const permissions = user?.permissions || [];

  const handleLogin = (loggedUser) => {
    setUser(loggedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    setUser(null);
    navigate("/");
  };

  return (
    <Routes>
      <Route path="/" element={<LoginPage onLogin={handleLogin} />} />

      <Route
        element={
          <ProtectedRoute onUserLoaded={setUser}>
            <MainLayout
              user={user}
              permissions={permissions}
              onLogout={handleLogout}
            />
          </ProtectedRoute>
        }
      >
        <Route
          path="/procedures"
          element={<ProceduresPage permissions={permissions} />}
        />

        <Route
          path="/procedure/create"
          element={<EditProcedurePage permissions={permissions} />}
        />

        <Route
          path="/procedures/:procedureId"
          element={<ProcedureDetailsPage permissions={permissions} />}
        />

        <Route
          path="/procedures/edit/:procedureId"
          element={<EditProcedurePage permissions={permissions} />}
        />

        <Route
          path="/review/"
          element={<ReviewProcedurePage permissions={permissions} />}
        />

        <Route
          path="/review/:reviewProcedureId"
          element={<ReviewItemDetail permissions={permissions} />}
        />

        <Route
          path="/users"
          element={<UsersPage permissions={permissions} />}
        />

        <Route
          path="/users/create"
          element={<UserCreate permissions={permissions} />}
        />

        <Route
          path="/users/:userId"
          element={<UserDetailsPage permissions={permissions} />}
        />

        <Route
          path="/users/edit/:userId/"
          element={<UserEditPage permissions={permissions} />}
        />

        <Route path="/roles" element={<RolePage permissions={permissions} />} />

        <Route
          path="/documents"
          element={<DocumentsPage permissions={permissions} />}
        />

        <Route path="/configuration" element={<p>Settings</p>} />
        <Route path="/audit" element={<p>Audit</p>} />
        <Route path="/profile" element={<ProfilePage user={user} />} />
        <Route
          path="/tasks"
          element={<TaskPage permissions={permissions} user={user} />}
        />
        <Route
          path="/execution/create"
          element={<ExecutionCreate permissions={permissions} />}
        />
        <Route path="/ai-create" element={<p>AI Create page</p>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
