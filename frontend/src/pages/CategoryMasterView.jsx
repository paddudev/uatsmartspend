import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { getCategoryMaster } from "../api/masters";

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

export default function CategoryMasterView() {
  const { categoryMasterId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getCategoryMaster(categoryMasterId)
      .then(setItem)
      .catch(() => setError("Unable to load category master."));
  }, [categoryMasterId]);

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Category master details
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {item && (
        <Paper sx={{ p: 3, maxWidth: 480 }}>
          <Stack spacing={2}>
            <Field label="Name" value={item.name} />
            <Field label="Common master" value={item.commonmaster_name || "—"} />
            <Field label="Tag" value={item.tag || "—"} />
            <Field label="Owner" value={item.owner_username || "—"} />
            <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
              <Button variant="contained" onClick={() => navigate(`/app/master/category/${categoryMasterId}/edit`)}>
                Edit
              </Button>
              <Button onClick={() => navigate("/app/master/category")}>Back to list</Button>
            </Stack>
          </Stack>
        </Paper>
      )}
    </>
  );
}
