import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./auth/ProtectedRoute";
import RequireCapability from "./auth/RequireCapability";
import { useAuth } from "./auth/AuthContext";
import { firstAccessiblePath } from "./navConfig";
import { Alert, Typography } from "@mui/material";
import Dashboard from "./pages/Dashboard";
import Account from "./pages/Account";
import UserView from "./pages/UserView";
import UserEdit from "./pages/UserEdit";
import UserCreate from "./pages/UserCreate";
import UserGroups from "./pages/UserGroups";
import UserGroupView from "./pages/UserGroupView";
import UserGroupEdit from "./pages/UserGroupEdit";
import UserGroupCreate from "./pages/UserGroupCreate";
import CommonMasters from "./pages/CommonMasters";
import CommonMasterCreate from "./pages/CommonMasterCreate";
import CommonMasterView from "./pages/CommonMasterView";
import CommonMasterEdit from "./pages/CommonMasterEdit";
import CategoryMasters from "./pages/CategoryMasters";
import CategoryMasterCreate from "./pages/CategoryMasterCreate";
import CategoryMasterView from "./pages/CategoryMasterView";
import CategoryMasterEdit from "./pages/CategoryMasterEdit";
import ProductsAndServicesList from "./pages/ProductsAndServicesList";
import ProductsAndServicesCreate from "./pages/ProductsAndServicesCreate";
import ProductsAndServicesView from "./pages/ProductsAndServicesView";
import ProductsAndServicesEdit from "./pages/ProductsAndServicesEdit";
import Transaction from "./pages/Transaction";
import Reports from "./pages/Reports";

function AppIndex() {
  const { user } = useAuth();
  const path = firstAccessiblePath(user);

  if (!path) {
    return (
      <>
        <Typography variant="h4" gutterBottom>
          Access restricted
        </Typography>
        <Alert severity="warning">
          Your account doesn't have access to any pages yet. Contact an administrator.
        </Alert>
      </>
    );
  }

  return <Navigate to={path} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<MainLayout />}>
          <Route index element={<AppIndex />} />

          <Route element={<RequireCapability capability="get_dashboard" />}>
            <Route path="dashboard" element={<Dashboard />} />
          </Route>

          <Route element={<RequireCapability capability="get_user" />}>
            <Route path="account" element={<Account />} />
            <Route path="account/new" element={<UserCreate />} />
            <Route path="account/:userId" element={<UserView />} />
            <Route path="account/:userId/edit" element={<UserEdit />} />
          </Route>

          <Route element={<RequireCapability capability="get_usergroup" />}>
            <Route path="account/groups" element={<UserGroups />} />
            <Route path="account/groups/new" element={<UserGroupCreate />} />
            <Route path="account/groups/:groupId" element={<UserGroupView />} />
            <Route path="account/groups/:groupId/edit" element={<UserGroupEdit />} />
          </Route>

          <Route element={<RequireCapability capability="get_common_master" />}>
            <Route path="master/common" element={<CommonMasters />} />
            <Route path="master/common/new" element={<CommonMasterCreate />} />
            <Route path="master/common/:commonMasterId" element={<CommonMasterView />} />
            <Route path="master/common/:commonMasterId/edit" element={<CommonMasterEdit />} />
          </Route>

          <Route element={<RequireCapability capability="get_category_master" />}>
            <Route path="master/category" element={<CategoryMasters />} />
            <Route path="master/category/new" element={<CategoryMasterCreate />} />
            <Route path="master/category/:categoryMasterId" element={<CategoryMasterView />} />
            <Route path="master/category/:categoryMasterId/edit" element={<CategoryMasterEdit />} />
          </Route>

          <Route element={<RequireCapability capability="get_productandservices" />}>
            <Route path="master/products" element={<ProductsAndServicesList />} />
            <Route path="master/products/new" element={<ProductsAndServicesCreate />} />
            <Route path="master/products/:productId" element={<ProductsAndServicesView />} />
            <Route path="master/products/:productId/edit" element={<ProductsAndServicesEdit />} />
          </Route>

          <Route element={<RequireCapability capability="get_transactions" />}>
            <Route path="transaction" element={<Transaction />} />
          </Route>

          <Route element={<RequireCapability capability="get_reports" />}>
            <Route path="reports" element={<Reports />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
