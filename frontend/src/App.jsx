import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Account from "./pages/Account";
import UserView from "./pages/UserView";
import UserEdit from "./pages/UserEdit";
import UserCreate from "./pages/UserCreate";
import UserGroups from "./pages/UserGroups";
import UserGroupView from "./pages/UserGroupView";
import UserGroupEdit from "./pages/UserGroupEdit";
import UserGroupCreate from "./pages/UserGroupCreate";
import Master from "./pages/Master";
import Transaction from "./pages/Transaction";
import Reports from "./pages/Reports";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<MainLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="account" element={<Account />} />
          <Route path="account/new" element={<UserCreate />} />
          <Route path="account/groups" element={<UserGroups />} />
          <Route path="account/groups/new" element={<UserGroupCreate />} />
          <Route path="account/groups/:groupId" element={<UserGroupView />} />
          <Route path="account/groups/:groupId/edit" element={<UserGroupEdit />} />
          <Route path="account/:userId" element={<UserView />} />
          <Route path="account/:userId/edit" element={<UserEdit />} />
          <Route path="master" element={<Master />} />
          <Route path="transaction" element={<Transaction />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
