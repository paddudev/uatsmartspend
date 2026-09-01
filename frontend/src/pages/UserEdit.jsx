import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { getUser, updateUser } from "../api/users";
import { listUsergroups } from "../api/usergroups";
import NetworkAccessFields from "../components/NetworkAccessFields";
import UserProfileFields from "../components/UserProfileFields";
import { useNotification } from "../notifications/NotificationContext";

export default function UserEdit() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { notifySuccess } = useNotification();
  const [form, setForm] = useState(null);
  const [usergroups, setUsergroups] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getUser(userId), listUsergroups()])
      .then(([u, groups]) => {
        setForm({
          username: u.username,
          email: u.email,
          full_name: u.full_name,
          is_active: Boolean(u.is_active),
          usergroup_fk: u.usergroup_fk || "",
          network_access: u.network_access || "open",
          ip_addresses: u.ip_addresses || [],
          profile_photo: u.profile_photo || "",
          gender_fk: u.gender_fk || "",
          country_fk: u.country_fk || "",
          pincode_fk: u.pincode_fk || "",
        });
        setUsergroups(groups);
      })
      .catch(() => setError("Unable to load user."));
  }, [userId]);

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
      await updateUser(userId, {
        username: form.username,
        email: form.email,
        full_name: form.full_name,
        is_active: form.is_active ? 1 : 0,
        usergroup_fk: form.usergroup_fk,
        network_access: form.network_access,
        ip_addresses: form.network_access === "limited" ? form.ip_addresses : [],
        profile_photo: form.profile_photo || undefined,
        gender_fk: form.gender_fk || undefined,
        country_fk: form.country_fk || undefined,
        pincode_fk: form.pincode_fk || undefined,
      });
      notifySuccess("User updated successfully.");
      navigate(`/app/account/${userId}`);
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to save changes.");
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

            <FormControlLabel
              sx={{ gridColumn: "1 / -1" }}
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) => handleChange("is_active", e.target.checked)}
                />
              }
              label="Active"
            />
            <Stack direction="row" spacing={2} sx={{ gridColumn: "1 / -1" }}>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Saving..." : "Save"}
              </Button>
              <Button onClick={() => navigate(`/app/account/${userId}`)}>Cancel</Button>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </>
  );
}
