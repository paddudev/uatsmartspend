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
import { getPincode, listDistricts, updatePincode } from "../api/geography";

export default function PincodeEdit() {
  const { pincodeId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getPincode(pincodeId), listDistricts()])
      .then(([item, allDistricts]) => {
        setForm({ pincode: item.pincode, district_fk: item.district_fk });
        setDistricts(allDistricts);
      })
      .catch(() => setError("Unable to load pincode."));
  }, [pincodeId]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await updatePincode(pincodeId, { pincode: form.pincode, district_fk: form.district_fk });
      navigate(`/app/geography/pincode/${pincodeId}`);
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
        Edit pincode
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
                {submitting ? "Saving..." : "Save"}
              </Button>
              <Button onClick={() => navigate(`/app/geography/pincode/${pincodeId}`)}>Cancel</Button>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </>
  );
}
