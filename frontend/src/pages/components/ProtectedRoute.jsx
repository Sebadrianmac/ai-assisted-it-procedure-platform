import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const access = localStorage.getItem("access");

    if (!access) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;