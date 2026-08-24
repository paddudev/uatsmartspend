import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { getCommonMaster } from "../api/masters";

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

export default function CommonMasterView() {
  const { commonMasterId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getCommonMaster(commonMasterId)
      .then(setItem)
      .catch(() => setError("Unable to load common master."));
  }, [commonMasterId]);

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Common master details
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {item && (
        <Paper sx={{ p: 3, maxWidth: 480 }}>
          <Stack spacing={2}>
            <Field label="Name" value={item.name} />
            <Field label="Description" value={item.description || "—"} />
            <Field label="Tag" value={item.tag || "—"} />
            <Field label="Owner" value={item.owner_username || "—"} />
            <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
              <Button variant="contained" onClick={() => navigate(`/app/master/common/${commonMasterId}/edit`)}>
                Edit
              </Button>
              <Button onClick={() => navigate("/app/master/common")}>Back to list</Button>
            </Stack>
          </Stack>
        </Paper>
      )}
    </>
  );
}
