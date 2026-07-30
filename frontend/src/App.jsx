import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProceduresPage from "./pages/ProceduresPage";
import ProtectedRoute from "./pages/components/ProtectedRoute";
import ProfilePage from "./pages/ProfilePage";

function App() {
    return (
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route
                    path="/procedures"
                    element={
                        <ProtectedRoute>
                            <ProceduresPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                  path="/profile"
                  element={
                      <ProtectedRoute>
                          <ProfilePage />
                      </ProtectedRoute>
                  }
              />
            </Routes>

    );
}

export default App;