import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
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

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    // No email/reset backend exists yet; this is a UI-only stub.
    setSubmitted(true);
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: 360 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Forgot password
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Enter your account email and we'll send you reset instructions.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
          <Stack spacing={2}>
            {submitted && (
              <Alert severity="success">
                If an account exists for that email, reset instructions have been sent.
              </Alert>
            )}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              fullWidth
            />
            <Button type="submit" variant="contained" fullWidth>
              Send reset instructions
            </Button>
            <Link component={RouterLink} to="/" variant="body2" sx={{ alignSelf: "center" }}>
              Back to login
            </Link>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
