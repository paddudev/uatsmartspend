import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { getProductsAndServices } from "../api/masters";

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

export default function ProductsAndServicesView() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getProductsAndServices(productId)
      .then(setItem)
      .catch(() => setError("Unable to load product/service."));
  }, [productId]);

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Product/service details
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {item && (
        <Paper sx={{ p: 3, maxWidth: 480 }}>
          <Stack spacing={2}>
            <Field label="Name" value={item.name} />
            <Field label="Description" value={item.description || "—"} />
            <Field label="Category" value={item.category_name || "—"} />
            <Field label="Owner" value={item.owner_username || "—"} />
            <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
              <Button variant="contained" onClick={() => navigate(`/app/master/products/${productId}/edit`)}>
                Edit
              </Button>
              <Button onClick={() => navigate("/app/master/products")}>Back to list</Button>
            </Stack>
          </Stack>
        </Paper>
      )}
    </>
  );
}
