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
import { createUser } from "../api/users";
import { listUsergroups } from "../api/usergroups";
import NetworkAccessFields from "../components/NetworkAccessFields";
import UserProfileFields from "../components/UserProfileFields";
import { useNotification } from "../notifications/NotificationContext";

const emptyForm = {
  username: "",
  email: "",
  full_name: "",
  password: "",
  usergroup_fk: "",
  network_access: "open",
  ip_addresses: [],
  profile_photo: "",
  gender_fk: "",
  country_fk: "",
  pincode_fk: "",
};

export default function UserCreate() {
  const navigate = useNavigate();
  const { notifySuccess } = useNotification();
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
    if (!form.usergroup_fk) {
      setError("Select a user group.");
      return;
    }
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
        usergroup_fk: form.usergroup_fk,
        is_active: 1,
        profile_photo: form.profile_photo || undefined,
        gender_fk: form.gender_fk || undefined,
        country_fk: form.country_fk || undefined,
        pincode_fk: form.pincode_fk || undefined,
      });
      notifySuccess("User created successfully.");
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

      <Paper sx={{ p: 3, width: "100%" }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
              gap: 2,
            }}
          >
            {error && (
              <Box sx={{ gridColumn: "1 / -1" }}>
                <Alert severity="error">{error}</Alert>
              </Box>
            )}
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
              required
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
              required
              fullWidth
            >
              {usergroups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.description || group.name}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ gridColumn: "1 / -1" }}>
              <NetworkAccessFields
                networkAccess={form.network_access}
                ipAddresses={form.ip_addresses}
                onNetworkAccessChange={(value) => handleChange("network_access", value)}
                onIpAddressesChange={(ips) => handleChange("ip_addresses", ips)}
              />
            </Box>

            <UserProfileFields
              profilePhoto={form.profile_photo}
              onProfilePhotoChange={(value) => handleChange("profile_photo", value)}
              genderId={form.gender_fk}
              onGenderChange={(value) => handleChange("gender_fk", value)}
              countryId={form.country_fk}
              onCountryChange={(value) => handleChange("country_fk", value)}
              pincodeId={form.pincode_fk}
              onPincodeChange={(value) => handleChange("pincode_fk", value)}
            />

            <Stack direction="row" spacing={2} sx={{ gridColumn: "1 / -1" }}>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Creating..." : "Create user"}
              </Button>
              <Button onClick={() => navigate("/app/account")}>Cancel</Button>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </>
  );
}
