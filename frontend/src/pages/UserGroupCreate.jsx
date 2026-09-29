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
import { createUsergroup } from "../api/usergroups";
import { useAuth } from "../auth/AuthContext";
import CapabilitySelect from "../components/CapabilitySelect";
import { useNotification } from "../notifications/NotificationContext";

const emptyForm = {
  name: "",
  description: "",
  tag: "",
  capability_ids: [],
};

export default function UserGroupCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifySuccess } = useNotification();
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
      await createUsergroup({
        name: form.name,
        description: form.description,
        tag: form.tag,
        userid_fk: user.id,
        capability_ids: form.capability_ids,
      });
      notifySuccess("User group created successfully.");
      navigate("/app/account/groups");
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to create user group.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Add user group
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
              label="Name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              fullWidth
            />
            <TextField
              label="Tag"
              value={form.tag}
              onChange={(e) => handleChange("tag", e.target.value)}
              fullWidth
            />

            <Box sx={{ gridColumn: "1 / -1" }}>
              <CapabilitySelect
                selectedIds={form.capability_ids}
                onChange={(ids) => handleChange("capability_ids", ids)}
              />
            </Box>

            <Stack direction="row" spacing={2} sx={{ gridColumn: "1 / -1" }}>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Creating..." : "Create user group"}
              </Button>
              <Button onClick={() => navigate("/app/account/groups")}>Cancel</Button>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </>
  );
}
