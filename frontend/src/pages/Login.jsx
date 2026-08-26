import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";
import { useColorMode } from "../theme/ColorModeContext";
import logoLight from "../assets/smartspend-logo-light.png";
import logoDark from "../assets/smartspend-logo-dark.png";

export default function Login() {
  const { login } = useAuth();
  const { mode } = useColorMode();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/app", { replace: true });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail || "Unable to log in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Paper elevation={3} sx={{ p: 4, width: 360 }}>
          <Box
            component="img"
            src={mode === "dark" ? logoDark : logoLight}
            alt="SmartSpend"
            sx={{ display: "block", height: 40, mx: "auto", mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ textAlign: "center" }}>
            Sign in to continue
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
              />
              <Button type="submit" variant="contained" disabled={submitting} fullWidth>
                {submitting ? "Signing in..." : "Login"}
              </Button>
              <Link component={RouterLink} to="/forgot-password" variant="body2" sx={{ alignSelf: "center" }}>
                Forgot password?
              </Link>
            </Stack>
          </Box>
        </Paper>
      </Box>

      <Box component="footer" sx={{ py: 2, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} SmartSpend. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
