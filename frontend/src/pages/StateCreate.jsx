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
import { createState, listCountries } from "../api/geography";

const emptyForm = { state: "", country_fk: "" };

export default function StateCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [countries, setCountries] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listCountries()
      .then(setCountries)
      .catch(() => setError("Unable to load countries."));
  }, []);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createState({ state: form.state, country_fk: form.country_fk });
      navigate("/app/geography/state");
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to create state.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Add state
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
              label="State"
              value={form.state}
              onChange={(e) => handleChange("state", e.target.value)}
              required
              fullWidth
              helperText="Letters only, up to 25 characters"
            />
            <TextField
              select
              label="Country"
              value={form.country_fk}
              onChange={(e) => handleChange("country_fk", e.target.value)}
              required
              fullWidth
            >
              {countries.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.country}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction="row" spacing={2} sx={{ gridColumn: "1 / -1" }}>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Creating..." : "Create state"}
              </Button>
              <Button onClick={() => navigate("/app/geography/state")}>Cancel</Button>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </>
  );
}
