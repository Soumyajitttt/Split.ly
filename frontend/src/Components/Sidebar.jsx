import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/groups", label: "Groups" },
    { to: "/expenses", label: "Expenses" },
    { to: "/activity", label: "Activity" },
    { to: "/balances", label: "Balances" },
    { to: "/settlements", label: "Settlements" },
    { to: "/profile", label: "Profile" },
  ];

  return (
    <aside className="w-60 bg-white border-r shadow-sm min-h-screen p-4">
      <h1 className="text-xl font-bold mb-6 text-green-600">Collectioneur</h1>

      <nav className="flex flex-col gap-2">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `px-4 py-2 rounded-md ${
                isActive ? "bg-green-100 text-green-700" : "text-gray-700"
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}