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
import { getDistrict, listStates, updateDistrict } from "../api/geography";

export default function DistrictEdit() {
  const { districtId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [states, setStates] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getDistrict(districtId), listStates()])
      .then(([item, allStates]) => {
        setForm({
          city: item.city,
          district: item.district,
          state_fk: item.state_fk,
          tag: item.tag?.note || "",
        });
        setStates(allStates);
      })
      .catch(() => setError("Unable to load district."));
  }, [districtId]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await updateDistrict(districtId, {
        city: form.city,
        district: form.district,
        state_fk: form.state_fk,
        tag: form.tag ? { note: form.tag } : null,
      });
      navigate(`/app/geography/district/${districtId}`);
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
        Edit district
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
              label="City"
              value={form.city}
              onChange={(e) => handleChange("city", e.target.value)}
              required
              fullWidth
              helperText="Letters only, up to 25 characters"
            />
            <TextField
              label="District"
              value={form.district}
              onChange={(e) => handleChange("district", e.target.value)}
              required
              fullWidth
              helperText="Letters only, up to 25 characters"
            />
            <TextField
              select
              label="State"
              value={form.state_fk}
              onChange={(e) => handleChange("state_fk", e.target.value)}
              required
              fullWidth
            >
              {states.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.state}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Tag"
              value={form.tag}
              onChange={(e) => handleChange("tag", e.target.value)}
              fullWidth
              helperText="Optional free-form note"
            />

            <Stack direction="row" spacing={2} sx={{ gridColumn: "1 / -1" }}>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Saving..." : "Save"}
              </Button>
              <Button onClick={() => navigate(`/app/geography/district/${districtId}`)}>Cancel</Button>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </>
  );
}
