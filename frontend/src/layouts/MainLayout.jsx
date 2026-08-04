import { Outlet } from "react-router-dom";

import Navbar from "../pages/components/Navbar";
import Sidebar from "../pages/components/Sidebar";
import "../../styles/MainLayout.css";

const MainLayout = ({
  user,
  permissions = [],
  onLogout,
}) => {
  return (
    <div className="app-layout">
      <Sidebar permissions = {permissions}/>

      <div className="app-main">
        <Navbar
          user={user}
          onLogout={onLogout}
        />

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;