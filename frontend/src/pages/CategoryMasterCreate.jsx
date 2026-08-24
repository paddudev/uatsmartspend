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
import { createCategoryMaster, listCommonMasters } from "../api/masters";
import { listUsers } from "../api/users";

const emptyForm = { name: "", commonmaster_fk: "", tag: "", userid_fk: "" };

export default function CategoryMasterCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [users, setUsers] = useState([]);
  const [commonMasters, setCommonMasters] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([listUsers(), listCommonMasters()])
      .then(([allUsers, commons]) => {
        setUsers(allUsers);
        setCommonMasters(commons);
      })
      .catch(() => setError("Unable to load users or common masters."));
  }, []);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createCategoryMaster({
        name: form.name,
        commonmaster_fk: form.commonmaster_fk,
        tag: form.tag,
        userid_fk: form.userid_fk,
      });
      navigate("/app/master/category");
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to create category master.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Add category master
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
              select
              label="Common master"
              value={form.commonmaster_fk}
              onChange={(e) => handleChange("commonmaster_fk", e.target.value)}
              required
              fullWidth
            >
              {commonMasters.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
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

            <Stack direction="row" spacing={2} sx={{ gridColumn: "1 / -1" }}>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Creating..." : "Create category master"}
              </Button>
              <Button onClick={() => navigate("/app/master/category")}>Cancel</Button>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </>
  );
}
