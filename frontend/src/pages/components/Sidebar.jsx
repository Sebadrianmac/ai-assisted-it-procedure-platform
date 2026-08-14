import { NavLink } from "react-router-dom";

import Can from "./Can";
import { useState } from "react";


const Sidebar = ({ permissions = [] }) => {
  const [isAdministrationOpen, setIsAdministrationOpen] = useState(false);
  
  const canViewAdministration = 
    permissions.includes("users.view_user") ||
    permissions.includes("auth.view_group");


  const canVieReviewProc = permissions.includes("procedures.approve_procedure");
  return (
    <aside className="sidebar">
      <h2>IT Platform</h2>

      <nav className="sidebar-navigation">
        <Can
          permission="procedures.view_procedure"
          permissions={permissions}
        >
          <NavLink to="/procedures">
            Procedures
          </NavLink>
        </Can>

        <Can
          permission="procedures.add_procedure"
          permissions={permissions}
        >
          <NavLink to="/procedure/create">
            Add Procedure
          </NavLink>
        </Can>

      {canVieReviewProc && (
        <div>
          <Can
          permission={
            "procedures.approve_procedure"
          }
          permissions={permissions}
        >
          <NavLink to="/review/">
            Review Procedure
          </NavLink>
          </Can>

        </div>
      )}

        {canViewAdministration && (
  <div>
    <button
      type="button"
      className="sidebar-menu-button"
      
      onClick={() =>
        setIsAdministrationOpen(
          (previousValue) => !previousValue
        )
      }
    >
      Administration
    </button>

        {isAdministrationOpen && (
          <ul className="administration-menu">
            <Can
              permission="users.view_user"
              permissions={permissions}
            >
              <li>
                <NavLink to="/users">
                  Users
                </NavLink>
              </li>
            </Can>

            <Can
              permission="auth.view_group"
              permissions={permissions}
            >
              <li>
                <NavLink to="/roles">
                  Roles
                </NavLink>
              </li>
            </Can>

            <li>
              <NavLink to="/configuration">
                Configuration
              </NavLink>
            </li>

            <li>
              <NavLink to="/audit">
                Audit Logs
              </NavLink>
            </li>
          </ul>
        )}
      </div>
    )}
        <Can
          permission={
            "procedures.generate_procedure_with_ai"
          }
          permissions={permissions}
        >
          <NavLink to="/ai-create">
            AI Create
          </NavLink>
        </Can>

        <NavLink to="/tasks">
          Tasks
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;