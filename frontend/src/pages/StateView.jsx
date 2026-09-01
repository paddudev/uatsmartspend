import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { getState } from "../api/geography";

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

export default function StateView() {
  const { stateId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getState(stateId)
      .then(setItem)
      .catch(() => setError("Unable to load state."));
  }, [stateId]);

  return (
    <>
      <Typography variant="h4" gutterBottom>
        State details
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
            <Field label="State" value={item.state} />
            <Field label="Country" value={item.country_name || "—"} />
            <Stack direction="row" spacing={2} sx={{ gridColumn: "1 / -1", pt: 1 }}>
              <Button variant="contained" onClick={() => navigate(`/app/geography/state/${stateId}/edit`)}>
                Edit
              </Button>
              <Button onClick={() => navigate("/app/geography/state")}>Back to list</Button>
            </Stack>
          </Box>
        </Paper>
      )}
    </>
  );
}
