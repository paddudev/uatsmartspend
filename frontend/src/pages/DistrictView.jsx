import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { getDistrict } from "../api/geography";

function Field({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  );
}

export default function DistrictView() {
  const { districtId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDistrict(districtId)
      .then(setItem)
      .catch(() => setError("Unable to load district."));
  }, [districtId]);

  return (
    <>
      <Typography variant="h4" gutterBottom>
        District details
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {item && (
        <Paper sx={{ p: 3, width: "100%" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
              gap: 2,
            }}
          >
            <Field label="District" value={item.district} />
            <Field label="City" value={item.city} />
            <Field label="State" value={item.state_name || "—"} />
            <Field label="Country" value={item.country_name || "—"} />
            <Field label="Tag" value={item.tag?.note || "—"} />
            <Stack direction="row" spacing={2} sx={{ gridColumn: "1 / -1", pt: 1 }}>
              <Button variant="contained" onClick={() => navigate(`/app/geography/district/${districtId}/edit`)}>
                Edit
              </Button>
              <Button onClick={() => navigate("/app/geography/district")}>Back to list</Button>
            </Stack>
          </Box>
        </Paper>
      )}
    </>
  );
}
