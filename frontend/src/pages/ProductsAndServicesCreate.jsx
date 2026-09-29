import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { createProductsAndServices, listCategoryMasters, listCommonMasters } from "../api/masters";
import { listUsers } from "../api/users";
import { useNotification } from "../notifications/NotificationContext";

const emptyForm = { name: "", description: "", categorymaster_fks: [], userid_fk: "", brand_fks: [] };

export default function ProductsAndServicesCreate() {
  const navigate = useNavigate();
  const { notifySuccess } = useNotification();
  const [form, setForm] = useState(emptyForm);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([listUsers(), listCategoryMasters(), listCommonMasters()])
      .then(([allUsers, allCategories, allCommonMasters]) => {
        setUsers(allUsers);
        setCategories(allCategories);
        setBrands(allCommonMasters.filter((c) => c.tag === "brands"));
      })
      .catch(() => setError("Unable to load users or categories."));
  }, []);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.categorymaster_fks.length) {
      setError("Select at least one category.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await createProductsAndServices({
        name: form.name,
        description: form.description,
        categorymaster_fks: form.categorymaster_fks,
        userid_fk: form.userid_fk,
        brand_fks: form.brand_fks.length ? form.brand_fks : [""],
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
            <Autocomplete
              multiple
              options={categories}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={categories.filter((c) => form.categorymaster_fks.includes(c.id))}
              onChange={(e, newValue) => handleChange("categorymaster_fks", newValue.map((v) => v.id))}
              renderInput={(params) => (
                <TextField {...params} label="Categories" placeholder="Select categories" required />
              )}
              sx={{ gridColumn: { xs: "1 / -1", md: "span 2" } }}
            />
            <Autocomplete
              multiple
              options={brands}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={brands.filter((b) => form.brand_fks.includes(b.id))}
              onChange={(e, newValue) => handleChange("brand_fks", newValue.map((v) => v.id))}
              renderInput={(params) => <TextField {...params} label="Brands" placeholder="Select brands" />}
              sx={{ gridColumn: { xs: "1 / -1", md: "span 2" } }}
            />

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
