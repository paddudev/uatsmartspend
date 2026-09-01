import { useState } from "react";
import { Link as RouterLink, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Collapse,
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
} from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useAuth } from "../auth/AuthContext";
import { useColorMode } from "../theme/ColorModeContext";
import { getVisibleNavItems } from "../navConfig";
import logoLight from "../assets/smartspend-logo-light.png";
import logoDark from "../assets/smartspend-logo-dark.png";

const drawerWidth = 240;
const collapsedWidth = 72;
const COLLAPSE_STORAGE_KEY = "smartspend_drawer_collapsed";

// Among a group's children, the active one is whichever `to` is the longest
// matching prefix of the current path — so "/app/account/groups/5" resolves
// to "User Groups" rather than also matching the shorter "/app/account" (Users).
function activeChildTo(pathname, children) {
  const matches = children.filter(
    (child) => pathname === child.to || pathname.startsWith(`${child.to}/`)
  );
  matches.sort((a, b) => b.to.length - a.to.length);
  return matches[0]?.to;
}

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { mode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1"
  );
  const navItems = getVisibleNavItems(user);
  const [openGroups, setOpenGroups] = useState(() => {
    const initial = {};
    navItems.forEach((item) => {
      if (item.children && activeChildTo(location.pathname, item.children)) {
        initial[item.label] = true;
      }
    });
    return initial;
  });

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

  function handleGroupClick(label) {
    if (collapsed) {
      toggleCollapsed();
      setOpenGroups((prev) => ({ ...prev, [label]: true }));
    } else {
      setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
    }
  }

  const currentDrawerWidth = collapsed ? collapsedWidth : drawerWidth;

  const leafSx = {
    minHeight: 48,
    justifyContent: collapsed ? "center" : "flex-start",
    px: 2.5,
    "&.active": {
      bgcolor: "action.selected",
      borderRight: 3,
      borderColor: "primary.main",
    },
  };

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box
            component={RouterLink}
            to="/app"
            sx={{ display: "flex", alignItems: "center", lineHeight: 0 }}
          >
            <Box
              component="img"
              src={mode === "dark" ? logoDark : logoLight}
              alt="SmartSpend"
              sx={{ height: 36, width: "auto" }}
            />
          </Box>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
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
              {user?.profile_photo ? (
                <Avatar src={`data:image/png;base64,${user.profile_photo}`} sx={{ width: 32, height: 32 }} />
              ) : (
                <AccountCircle />
              )}
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
            {navItems.map((item) => {
              if (!item.children) {
                return (
                  <ListItemButton key={item.to} component={NavLink} to={item.to} sx={leafSx}>
                    <Tooltip title={collapsed ? item.label : ""} placement="right">
                      <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2, justifyContent: "center" }}>
                        {item.icon}
                      </ListItemIcon>
                    </Tooltip>
                    {!collapsed && <ListItemText primary={item.label} />}
                  </ListItemButton>
                );
              }

              const activeTo = activeChildTo(location.pathname, item.children);
              const isOpen = Boolean(openGroups[item.label]);

              return (
                <Box key={item.label}>
                  <ListItemButton
                    onClick={() => handleGroupClick(item.label)}
                    sx={{
                      minHeight: 48,
                      justifyContent: collapsed ? "center" : "flex-start",
                      px: 2.5,
                      ...(activeTo && {
                        bgcolor: "action.hover",
                      }),
                    }}
                  >
                    <Tooltip title={collapsed ? item.label : ""} placement="right">
                      <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2, justifyContent: "center" }}>
                        {item.icon}
                      </ListItemIcon>
                    </Tooltip>
                    {!collapsed && (
                      <>
                        <ListItemText primary={item.label} />
                        {isOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      </>
                    )}
                  </ListItemButton>
                  <Collapse in={isOpen && !collapsed} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.children.map((child) => (
                        <ListItemButton
                          key={child.to}
                          component={NavLink}
                          to={child.to}
                          sx={{
                            minHeight: 48,
                            justifyContent: "flex-start",
                            px: 2.5,
                            pl: 4.5,
                            ...(child.to === activeTo && {
                              bgcolor: "action.selected",
                              borderRight: 3,
                              borderColor: "primary.main",
                            }),
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 0, mr: 2, justifyContent: "center" }}>
                            {child.icon}
                          </ListItemIcon>
                          <ListItemText primary={child.label} />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                </Box>
              );
            })}
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
