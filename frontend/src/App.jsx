import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import Dashboard from "./pages/dashboard/Dashboard";
import Expenses from "./pages/expenses/Expenses";
import ExpenseDetails from "./pages/expenses/ExpenseDetails";
import AddExpense from "./pages/expenses/AddExpense";

import Groups from "./pages/groups/Groups";
import GroupDetails from "./pages/groups/GroupDetails";
import GroupAddExpense from "./pages/groups/GroupAddExpense";
import GroupMembers from "./pages/groups/GroupMembers";

import Activity from "./pages/activity/Activity";
import Balances from "./pages/balances/Balances";
import Settlements from "./pages/balances/Settlements";
import Profile from "./pages/profile/Profile";

import AdminUsers from "./pages/admin/AdminUsers";
import AdminActivity from "./pages/admin/AdminActivity";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* AUTH PAGES */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* USER PAGES */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Groups */}
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:id" element={<GroupDetails />} />
          <Route path="/groups/:id/add-expense" element={<GroupAddExpense />} />
          <Route path="/groups/:id/members" element={<GroupMembers />} />

          {/* Expenses */}
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/expenses/:id" element={<ExpenseDetails />} />
          <Route path="/add-expense" element={<AddExpense />} />

          {/* Activity */}
          <Route path="/activity" element={<Activity />} />

          {/* Balances */}
          <Route path="/balances" element={<Balances />} />
          <Route path="/settlements" element={<Settlements />} />

          {/* Profile */}
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* ADMIN */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/activity" element={<AdminActivity />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}
