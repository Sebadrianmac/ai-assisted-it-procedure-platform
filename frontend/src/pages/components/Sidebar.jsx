import { NavLink } from "react-router-dom";

import Can from "./Can";

const Sidebar = ({ permissions = [] }) => {
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