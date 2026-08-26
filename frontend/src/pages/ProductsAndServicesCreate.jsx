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
import { createProductsAndServices, listCategoryMasters } from "../api/masters";
import { listUsers } from "../api/users";
import { useNotification } from "../notifications/NotificationContext";

const emptyForm = { name: "", description: "", categorymaster_fk: "", userid_fk: "" };

export default function ProductsAndServicesCreate() {
  const navigate = useNavigate();
  const { notifySuccess } = useNotification();
  const [form, setForm] = useState(emptyForm);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([listUsers(), listCategoryMasters()])
      .then(([allUsers, allCategories]) => {
        setUsers(allUsers);
        setCategories(allCategories);
      })
      .catch(() => setError("Unable to load users or categories."));
  }, []);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createProductsAndServices({
        name: form.name,
        description: form.description,
        categorymaster_fk: form.categorymaster_fk,
        userid_fk: form.userid_fk,
      });
      notifySuccess("Product/service created successfully.");
      navigate("/app/master/products");
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to create product/service.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Add product/service
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
              select
              label="Category"
              value={form.categorymaster_fk}
              onChange={(e) => handleChange("categorymaster_fk", e.target.value)}
              required
              fullWidth
            >
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
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
                {submitting ? "Creating..." : "Create product/service"}
              </Button>
              <Button onClick={() => navigate("/app/master/products")}>Cancel</Button>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </>
  );
}
