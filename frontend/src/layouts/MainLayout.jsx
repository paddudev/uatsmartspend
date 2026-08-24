import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Switch,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import TuneIcon from "@mui/icons-material/Tune";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AccountCircle from "@mui/icons-material/AccountCircle";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useAuth } from "../auth/AuthContext";
import { useColorMode } from "../theme/ColorModeContext";

const drawerWidth = 240;
const collapsedWidth = 72;
const COLLAPSE_STORAGE_KEY = "smartspend_drawer_collapsed";

const navItems = [
  { label: "Dashboard", to: "/app/dashboard", icon: <DashboardIcon /> },
  { label: "Account", to: "/app/account", icon: <PeopleIcon /> },
  { label: "Master", to: "/app/master", icon: <TuneIcon /> },
  { label: "Transaction", to: "/app/transaction", icon: <ReceiptLongIcon /> },
  { label: "Reports", to: "/app/reports", icon: <AssessmentIcon /> },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { mode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1"
  );

  function handleLogout() {
    setAnchorEl(null);
    logout();
    navigate("/", { replace: true });
  }

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const currentDrawerWidth = collapsed ? collapsedWidth : drawerWidth;

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" noWrap component="div">
            SmartSpend
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <LightModeIcon fontSize="small" />
              <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
                <Switch
                  checked={mode === "dark"}
                  onChange={toggleColorMode}
                  color="default"
                  inputProps={{ "aria-label": "Toggle dark mode" }}
                />
              </Tooltip>
              <DarkModeIcon fontSize="small" />
            </Stack>
            <IconButton
              size="large"
              color="inherit"
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              <AccountCircle />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <MenuItem disabled>{user?.full_name || user?.username}</MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: currentDrawerWidth,
          flexShrink: 0,
          whiteSpace: "nowrap",
          transition: (theme) =>
            theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          [`& .MuiDrawer-paper`]: {
            width: currentDrawerWidth,
            overflowX: "hidden",
            boxSizing: "border-box",
            transition: (theme) =>
              theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          },
        }}
      >
        <Toolbar />
        <Box
          sx={{
            display: "flex",
            justifyContent: collapsed ? "center" : "flex-end",
            px: 1,
            py: 0.5,
          }}
        >
          <IconButton onClick={toggleCollapsed}>
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
        <Divider />
        <Box sx={{ overflow: "auto" }}>
          <List>
            {navItems.map((item) => (
              <ListItemButton
                key={item.to}
                component={NavLink}
                to={item.to}
                sx={{
                  minHeight: 48,
                  justifyContent: collapsed ? "center" : "flex-start",
                  px: 2.5,
                  "&.active": {
                    bgcolor: "action.selected",
                    borderRight: 3,
                    borderColor: "primary.main",
                  },
                }}
              >
                <Tooltip title={collapsed ? item.label : ""} placement="right">
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 2,
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                </Tooltip>
                {!collapsed && <ListItemText primary={item.label} />}
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
