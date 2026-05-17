import { NavLink } from "react-router-dom";

export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-white shadow-md border-r min-h-screen p-4">
      <h1 className="text-xl font-bold mb-6 text-blue-600">Admin Panel</h1>

      <nav className="flex flex-col gap-2">
        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            `px-4 py-2 rounded ${
              isActive ? "bg-blue-100 text-blue-700" : "text-gray-700"
            }`
          }
        >
          Users
        </NavLink>

        <NavLink
          to="/admin/activity"
          className={({ isActive }) =>
            `px-4 py-2 rounded ${
              isActive ? "bg-blue-100 text-blue-700" : "text-gray-700"
            }`
          }
        >
          Activity Logs
        </NavLink>
      </nav>
    </aside>
  );
}