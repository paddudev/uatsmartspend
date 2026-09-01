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
import { createPincode, listDistricts } from "../api/geography";

const emptyForm = { pincode: "", district_fk: "" };

export default function PincodeCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [districts, setDistricts] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listDistricts()
      .then(setDistricts)
      .catch(() => setError("Unable to load districts."));
  }, []);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createPincode({ pincode: form.pincode, district_fk: form.district_fk });
      navigate("/app/geography/pincode");
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to create pincode.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Add pincode
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
              label="Pincode"
              value={form.pincode}
              onChange={(e) => handleChange("pincode", e.target.value)}
              required
              fullWidth
              helperText="Exactly 6 alphanumeric characters"
              slotProps={{ htmlInput: { maxLength: 6 } }}
            />
            <TextField
              select
              label="District"
              value={form.district_fk}
              onChange={(e) => handleChange("district_fk", e.target.value)}
              required
              fullWidth
            >
              {districts.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.district}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction="row" spacing={2} sx={{ gridColumn: "1 / -1" }}>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Creating..." : "Create pincode"}
              </Button>
              <Button onClick={() => navigate("/app/geography/pincode")}>Cancel</Button>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </>
  );
}
