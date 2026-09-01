import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Avatar, Box, Button, Paper, Stack, Typography } from "@mui/material";
import FlagIcon from "@mui/icons-material/Flag";
import { getCountry } from "../api/geography";

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

export default function CountryView() {
  const { countryId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getCountry(countryId)
      .then(setItem)
      .catch(() => setError("Unable to load country."));
  }, [countryId]);

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Country details
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
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Avatar
                variant="rounded"
                src={item.flag ? `data:image/png;base64,${item.flag}` : undefined}
                sx={{ width: 64, height: 64 }}
              >
                <FlagIcon />
              </Avatar>
            </Box>
            <Field label="Country" value={item.country} />
            <Field label="Country code" value={item.country_code} />
            <Field label="Country phone code" value={item.country_phone_code} />
            <Field label="Currency code" value={item.currency?.currency_code || "—"} />
            <Field label="Currency symbol" value={item.currency?.currency_symbol || "—"} />
            <Field label="Currency name" value={item.currency?.currency_name || "—"} />
            <Stack direction="row" spacing={2} sx={{ gridColumn: "1 / -1", pt: 1 }}>
              <Button variant="contained" onClick={() => navigate(`/app/geography/country/${countryId}/edit`)}>
                Edit
              </Button>
              <Button onClick={() => navigate("/app/geography/country")}>Back to list</Button>
            </Stack>
          </Box>
        </Paper>
      )}
    </>
  );
}
