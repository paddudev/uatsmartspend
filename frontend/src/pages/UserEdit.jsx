import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { getUser, updateUser } from "../api/users";

export default function UserEdit() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getUser(userId)
      .then((u) =>
        setForm({
          username: u.username,
          email: u.email,
          full_name: u.full_name,
          is_active: Boolean(u.is_active),
        })
      )
      .catch(() => setError("Unable to load user."));
  }, [userId]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await updateUser(userId, { ...form, is_active: form.is_active ? 1 : 0 });
      navigate(`/app/account/${userId}`);
    } catch {
      setError("Unable to save changes.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!form) {
    return error ? <Alert severity="error">{error}</Alert> : null;
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Edit user
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
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) => handleChange("is_active", e.target.checked)}
                />
              }
              label="Active"
            />
            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Saving..." : "Save"}
              </Button>
              <Button onClick={() => navigate(`/app/account/${userId}`)}>Cancel</Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </>
  );
}
