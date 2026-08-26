import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { getUsergroup, updateUsergroup } from "../api/usergroups";
import { listUsers } from "../api/users";
import CapabilitySelect from "../components/CapabilitySelect";
import { useNotification } from "../notifications/NotificationContext";

export default function UserGroupEdit() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { notifySuccess } = useNotification();
  const [form, setForm] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getUsergroup(groupId), listUsers()])
      .then(([g, allUsers]) => {
        setForm({
          name: g.name,
          description: g.description || "",
          tag: g.tag || "",
          userid_fk: g.userid_fk,
          capability_ids: g.capability_ids || [],
        });
        setUsers(allUsers);
      })
      .catch(() => setError("Unable to load user group."));
  }, [groupId]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await updateUsergroup(groupId, {
        name: form.name,
        description: form.description,
        tag: form.tag,
        userid_fk: form.userid_fk,
        capability_ids: form.capability_ids,
      });
      notifySuccess("User group updated successfully.");
      navigate(`/app/account/groups/${groupId}`);
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
        Edit user group
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
            <TextField
              select
              label="Owner"
              value={form.userid_fk}
              onChange={(e) => handleChange("userid_fk", e.target.value)}
              required
              fullWidth
            >
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.full_name || u.username}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ gridColumn: "1 / -1" }}>
              <CapabilitySelect
                selectedIds={form.capability_ids}
                onChange={(ids) => handleChange("capability_ids", ids)}
              />
            </Box>

            <Stack direction="row" spacing={2} sx={{ gridColumn: "1 / -1" }}>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Saving..." : "Save"}
              </Button>
              <Button onClick={() => navigate(`/app/account/groups/${groupId}`)}>Cancel</Button>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </>
  );
}
