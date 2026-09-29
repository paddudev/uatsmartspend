import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
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
        <Paper sx={{ p: 3, width: "100%" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
              gap: 2,
            }}
          >
            <Field label="Name" value={item.name} />
            <Field label="Description" value={item.description || "—"} />
            <Field
              label="Categories"
              value={
                item.categories && item.categories.length > 0 ? (
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", rowGap: 0.5, mt: 0.5 }}>
                    {item.categories.map((c) => (
                      <Chip key={c.id} label={c.name} size="small" variant="outlined" />
                    ))}
                  </Stack>
                ) : (
                  "—"
                )
              }
            />
            <Field
              label="Brands"
              value={
                item.brands && item.brands.length > 0 ? (
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", rowGap: 0.5, mt: 0.5 }}>
                    {item.brands.map((b) => (
                      <Chip key={b.id} label={b.name} size="small" />
                    ))}
                  </Stack>
                ) : (
                  "—"
                )
              }
            />
            <Field label="Owner" value={item.owner_username || "—"} />
            <Stack direction="row" spacing={2} sx={{ gridColumn: "1 / -1", pt: 1 }}>
              <Button variant="contained" onClick={() => navigate(`/app/master/products/${productId}/edit`)}>
                Edit
              </Button>
              <Button onClick={() => navigate("/app/master/products")}>Back to list</Button>
            </Stack>
          </Box>
        </Paper>
      )}
    </>
  );
}
