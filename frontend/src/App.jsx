import { useState, } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { ACCESS_TOKEN, REFRESH_TOKEN } from "./api/constants";

import LoginPage from "./pages/LoginPage";
import ProceduresPage from "./pages/ProceduresPage";
import ProcedureCreate from "./procedure/ProcedureCreate";
import ReviewProcedurePage from "./pages/ReviewProcedurePage";
import ReviewItemDetail from "./procedure/ReviewItemDetail";
import ProcedureDetailsPage from "./procedure/ProcedureDetailsPage";
import EditProcedurePage from "./procedure/EditProcedurePage";
import ProfilePage from "./pages/ProfilePage";
import UsersPage from "./pages/UsersPage";
import ProtectedRoute from "./pages/components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import UserDetailsPage from "./users/UserDetailsPage";
import UserCreate from "./users/UserCreate";
import UserEditPage from "./users/UserEditPage";
import RolePage from "./pages/RolePage";
import DocumentsPage from "./pages/DocumentsPage";



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
          element={<ProcedureCreate 
          permissions={
                user?.permissions || []
              }
          />}
        />
        <Route
          path="/review/"
          element={
            <ReviewProcedurePage
              permissions={
                user?.permissions || []
              }
            />
          }
        />
        <Route
          path="/review/:reviewProcedureId"
          element={
            <ReviewItemDetail
              permissions={
                user?.permissions || []
              }
            />
          }
        />
        <Route
          path="/procedures/:procedureId"
          element={<ProcedureDetailsPage 
          permissions={
                user?.permissions || []
              }
          />}
        />

        <Route
          path="/procedures/edit/:procedureId"
          element={<EditProcedurePage 
          permissions={
                user?.permissions || []
              }
          />}
        />

        <Route 
          path="/users"
          element={<UsersPage
            permissions={
                user?.permissions || []
              }
            />}
        />

        <Route 
          path="/users/create"
          element={<UserCreate
            permissions={
                user?.permissions || []
              }
            />}
        />
        <Route
          path="/users/:userId"
          element={
            <UserDetailsPage
              permissions={
                user?.permissions || []
              }
            />
          }
        />
        <Route
        path="/users/edit/:userId/"
        element={
          <UserEditPage
            permissions={
              user?.permissions || []
            }
          />
        }
         />
        <Route
          path="/roles"
          element={
          <RolePage 
            permissions={
              user?.permissions || []
            }  
          />}
        />
        <Route
          path="/configuration"
          element={<p>Settings</p>}
        />
        <Route
          path="/audit"
          element={<p>Audit</p>}
        />

        <Route
          path="/profile"
          element={
            <ProfilePage user={user} />
          }
        />
        <Route
          path="/documents"
          element={
          <DocumentsPage 
            permissions={
              user?.permissions || []
            }  
          />}
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