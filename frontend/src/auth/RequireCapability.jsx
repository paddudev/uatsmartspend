import { Outlet } from "react-router-dom";
import { Alert, Typography } from "@mui/material";
import { useAuth } from "./AuthContext";
import { hasCapability } from "../navConfig";

export default function RequireCapability({ capability }) {
  const { user } = useAuth();

  if (!hasCapability(user, capability)) {
    return (
      <>
        <Typography variant="h4" gutterBottom>
          Access restricted
        </Typography>
        <Alert severity="warning">
          Your account doesn't have the "{capability}" capability needed to view this page.
          Contact an administrator if you believe this is a mistake.
        </Alert>
      </>
    );
  }

  return <Outlet />;
}
