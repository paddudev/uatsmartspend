import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { getProductsAndServices, listCategoryMasters, listCommonMasters, updateProductsAndServices } from "../api/masters";
import { useAuth } from "../auth/AuthContext";
import { useNotification } from "../notifications/NotificationContext";

export default function ProductsAndServicesEdit() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifySuccess } = useNotification();
  const [form, setForm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getProductsAndServices(productId), listCategoryMasters(), listCommonMasters()])
      .then(([item, allCategories, allCommonMasters]) => {
        setForm({
          name: item.name,
          description: item.description || "",
          categorymaster_fks: (item.categories || []).map((c) => c.id),
          brand_fks: (item.brands || []).map((b) => b.id),
        });
        setCategories(allCategories);
        setBrands(allCommonMasters.filter((c) => c.tag === "brands"));
      })
      .catch(() => setError("Unable to load product/service."));
  }, [productId]);

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
      await updateProductsAndServices(productId, {
        name: form.name,
        description: form.description,
        categorymaster_fks: form.categorymaster_fks,
        userid_fk: user.id,
        brand_fks: form.brand_fks.length ? form.brand_fks : [""],
      });
      notifySuccess("Product/service updated successfully.");
      navigate(`/app/master/products/${productId}`);
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
        Edit product/service
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
                {submitting ? "Saving..." : "Save"}
              </Button>
              <Button onClick={() => navigate(`/app/master/products/${productId}`)}>Cancel</Button>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </>
  );
}
