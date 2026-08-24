import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { createUser, listUsergroups } from "../api/users";
import NetworkAccessFields from "../components/NetworkAccessFields";

const emptyForm = {
  username: "",
  email: "",
  full_name: "",
  password: "",
  usergroup_fk: "",
  network_access: "open",
  ip_addresses: [],
};

export default function UserCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [usergroups, setUsergroups] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listUsergroups()
      .then(setUsergroups)
      .catch(() => setError("Unable to load user groups."));
  }, []);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.network_access === "limited" && form.ip_addresses.length === 0) {
      setError("Add at least one IP address for limited network access.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await createUser({
        username: form.username,
        email: form.email,
        full_name: form.full_name,
        password: form.password,
        network_access: form.network_access,
        ip_addresses: form.network_access === "limited" ? form.ip_addresses : undefined,
        usergroup_fk: form.usergroup_fk || undefined,
        is_active: 1,
      });
      navigate("/app/account");
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to create user.");
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
            <TextField
              select
              label="User group"
              value={form.usergroup_fk}
              onChange={(e) => handleChange("usergroup_fk", e.target.value)}
              fullWidth
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {usergroups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.description || group.name}
                </MenuItem>
              ))}
            </TextField>

            <NetworkAccessFields
              networkAccess={form.network_access}
              ipAddresses={form.ip_addresses}
              onNetworkAccessChange={(value) => handleChange("network_access", value)}
              onIpAddressesChange={(ips) => handleChange("ip_addresses", ips)}
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
