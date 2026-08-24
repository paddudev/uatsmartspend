import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { createUser } from "../api/users";

const emptyForm = { username: "", email: "", full_name: "", password: "" };

export default function UserCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createUser({
        username: form.username,
        email: form.email,
        full_name: form.full_name,
        hashed_password: form.password,
        is_active: 1,
      });
      navigate("/app/account");
    } catch {
      setError("Unable to create user.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Add user
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 480 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Username"
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Full name"
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              required
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Creating..." : "Create user"}
              </Button>
              <Button onClick={() => navigate("/app/account")}>Cancel</Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </>
  );
}
