import { memo } from "react";
import { Link } from "react-router-dom";

import heximus from "../../assets/heximus.png";
import profile from "../../assets/profile.png";
import logout from "../../assets/logout.png";

import "./Navbar.css";

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar">
      <Link to="/procedures">
        <img
          src={heximus}
          alt="Heximus"
          className="logo"
        />
      </Link>


      <div className="navbar-user"> 
        <span>
          {user?.username || "User"}
        </span>
        <Link to="/profile">
          <img
            src={profile}
            alt="Profile"
            className=""
          />
        </Link>

        <Link 
            to=""
            onClick={onLogout}
        >
          <img
            src={logout}
            alt="Log Out"
            className=""
          />
        </Link>       



      </div>
    </nav>
  );
};

export default memo(Navbar);