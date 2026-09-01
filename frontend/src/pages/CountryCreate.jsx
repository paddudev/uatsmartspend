import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import FlagIcon from "@mui/icons-material/Flag";
import { createCountry } from "../api/geography";
import { fileToBase64 } from "../utils/fileToBase64";

const emptyForm = {
  country: "",
  country_code: "",
  country_phone_code: "",
  flag: "",
  currency_code: "",
  currency_symbol: "",
  currency_name: "",
};

export default function CountryCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleFlagChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    handleChange("flag", base64);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const hasCurrency = form.currency_code || form.currency_symbol || form.currency_name;
      await createCountry({
        country: form.country,
        country_code: form.country_code,
        country_phone_code: form.country_phone_code,
        flag: form.flag || undefined,
        currency: hasCurrency
          ? {
              currency_code: form.currency_code,
              currency_symbol: form.currency_symbol,
              currency_name: form.currency_name,
            }
          : undefined,
      });
      navigate("/app/geography/country");
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to create country.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Add country
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
              label="Country"
              value={form.country}
              onChange={(e) => handleChange("country", e.target.value)}
              required
              fullWidth
              helperText="Alphanumeric, up to 50 characters"
            />
            <TextField
              label="Country code"
              value={form.country_code}
              onChange={(e) => handleChange("country_code", e.target.value)}
              required
              fullWidth
              helperText="Alphanumeric, up to 3 characters"
            />
            <TextField
              label="Country phone code"
              value={form.country_phone_code}
              onChange={(e) => handleChange("country_phone_code", e.target.value)}
              required
              fullWidth
              helperText="e.g. +91, up to 3 characters"
            />

            <Stack direction="row" spacing={2} sx={{ gridColumn: "1 / -1", alignItems: "center" }}>
              <Avatar
                variant="rounded"
                src={form.flag ? `data:image/png;base64,${form.flag}` : undefined}
                sx={{ width: 48, height: 48 }}
              >
                <FlagIcon />
              </Avatar>
              <Button variant="outlined" component="label">
                Upload flag
                <input type="file" accept="image/*" hidden onChange={handleFlagChange} />
              </Button>
            </Stack>

            <TextField
              label="Currency code"
              value={form.currency_code}
              onChange={(e) => handleChange("currency_code", e.target.value)}
              fullWidth
              helperText="e.g. INR"
            />
            <TextField
              label="Currency symbol"
              value={form.currency_symbol}
              onChange={(e) => handleChange("currency_symbol", e.target.value)}
              fullWidth
              helperText="e.g. ₹"
            />
            <TextField
              label="Currency name"
              value={form.currency_name}
              onChange={(e) => handleChange("currency_name", e.target.value)}
              fullWidth
              helperText="e.g. Rupee"
            />

            <Stack direction="row" spacing={2} sx={{ gridColumn: "1 / -1" }}>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Creating..." : "Create country"}
              </Button>
              <Button onClick={() => navigate("/app/geography/country")}>Cancel</Button>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </>
  );
}
