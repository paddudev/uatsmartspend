import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";
import TuneIcon from "@mui/icons-material/Tune";
import LayersIcon from "@mui/icons-material/Layers";
import CategoryIcon from "@mui/icons-material/Category";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AssessmentIcon from "@mui/icons-material/Assessment";

// Each leaf's `capability` must match a capabilitymaster.name the user's
// usergroup can be granted (e.g. "get_user"). A leaf with no `capability`
// is always visible once logged in. Keep this as the single source of
// truth for both the drawer (MainLayout) and route guards (App.jsx) so
// the two can't drift apart.
export const navItems = [
  { label: "Dashboard", to: "/app/dashboard", icon: <DashboardIcon />, capability: "get_dashboard" },
  {
    label: "Account",
    icon: <PeopleIcon />,
    children: [
      { label: "Users", to: "/app/account", icon: <PersonIcon />, capability: "get_user" },
      { label: "User Groups", to: "/app/account/groups", icon: <GroupsIcon />, capability: "get_usergroup" },
    ],
  },
  {
    label: "Master",
    icon: <TuneIcon />,
    children: [
      { label: "Common Master", to: "/app/master/common", icon: <LayersIcon />, capability: "get_common_master" },
      { label: "Category Master", to: "/app/master/category", icon: <CategoryIcon />, capability: "get_category_master" },
      { label: "Products & Services", to: "/app/master/products", icon: <Inventory2Icon />, capability: "get_productandservices" },
    ],
  },
  { label: "Transaction", to: "/app/transaction", icon: <ReceiptLongIcon />, capability: "get_transactions" },
  { label: "Reports", to: "/app/reports", icon: <AssessmentIcon />, capability: "get_reports" },
];

export function hasCapability(user, capability) {
  if (!capability) return true;
  return Boolean(user?.capabilities?.includes(capability));
}

export function getVisibleNavItems(user) {
  return navItems
    .map((item) => {
      if (item.children) {
        const visibleChildren = item.children.filter((child) => hasCapability(user, child.capability));
        return visibleChildren.length ? { ...item, children: visibleChildren } : null;
      }
      return hasCapability(user, item.capability) ? item : null;
    })
    .filter(Boolean);
}

export function firstAccessiblePath(user) {
  const [first] = getVisibleNavItems(user);
  if (!first) return null;
  return first.to || first.children?.[0]?.to || null;
}
