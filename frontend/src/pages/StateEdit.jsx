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
import { getState, listCountries, updateState } from "../api/geography";

export default function StateEdit() {
  const { stateId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [countries, setCountries] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getState(stateId), listCountries()])
      .then(([item, allCountries]) => {
        setForm({ state: item.state, country_fk: item.country_fk });
        setCountries(allCountries);
      })
      .catch(() => setError("Unable to load state."));
  }, [stateId]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await updateState(stateId, { state: form.state, country_fk: form.country_fk });
      navigate(`/app/geography/state/${stateId}`);
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
        Edit state
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
                {submitting ? "Saving..." : "Save"}
              </Button>
              <Button onClick={() => navigate(`/app/geography/state/${stateId}`)}>Cancel</Button>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </>
  );
}
