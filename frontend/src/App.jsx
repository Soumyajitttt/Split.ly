import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

import Login from "./Pages/auth/Login";
import Register from "./Pages/auth/Register";

import Dashboard from "./Pages/dashboard/Dashboard";
import Expenses from "./Pages/expenses/Expenses";
import ExpenseDetails from "./Pages/expenses/ExpenseDetails";
import AddExpense from "./Pages/expenses/AddExpense";

import Groups from "./Pages/groups/Groups";
import GroupDetails from "./Pages/groups/GroupDetails";
import GroupAddExpense from "./Pages/groups/GroupAddExpense";
import GroupMembers from "./Pages/groups/GroupMembers";

import Activity from "./Pages/activity/Activity";
import Balances from "./Pages/balances/Balances";
import Settlements from "./Pages/balances/Settlements";
import Profile from "./Pages/profile/Profile";

import AdminUsers from "./Pages/admin/AdminUsers";
import AdminActivity from "./Pages/admin/AdminActivity";

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
