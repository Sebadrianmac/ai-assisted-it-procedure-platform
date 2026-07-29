import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProceduresPage from "./pages/ProceduresPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/procedures" element={<ProceduresPage />} />
    </Routes>
  );
}

export default App;