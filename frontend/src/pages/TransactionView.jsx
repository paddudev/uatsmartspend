import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { getTransaction } from "../api/transactions";
import { getBill } from "../api/bills";

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

export default function TransactionView() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [bill, setBill] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getTransaction(transactionId)
      .then((t) => {
        setItem(t);
        if (t.bill_upload_fk) {
          getBill(t.bill_upload_fk).then(setBill).catch(() => {});
        }
      })
      .catch(() => setError("Unable to load transaction."));
  }, [transactionId]);

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Transaction details
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
            <Field label="Amount" value={item.amount} />
            <Field label="Transaction date" value={item.transaction_date} />
            <Field label="Owner" value={item.owner_username || "—"} />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Common master
              </Typography>
              {item.commonmaster_name ? (
                <Chip
                  label={item.commonmaster_name}
                  size="small"
                  color={item.commonmaster_name === "Gains" ? "success" : "default"}
                />
              ) : (
                <Typography variant="body1">—</Typography>
              )}
            </Box>
            <Field label="Category" value={item.category_name || "—"} />
            <Field label="Product/Service" value={item.product_name || "—"} />
            <Field label="Brand" value={item.brand_name || "—"} />
            <Field label="Note" value={item.note || "—"} />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Source
              </Typography>
              <Chip
                label={item.source === "ai" ? "AI classified" : item.source === "draft" ? "Draft" : "Manual"}
                size="small"
                color={item.source === "ai" ? "success" : item.source === "draft" ? "warning" : "default"}
              />
            </Box>
            {item.raw_item_text && <Field label="Original bill text" value={item.raw_item_text} />}
            {bill?.file_data && bill.file_type?.startsWith("image/") && (
              <Box sx={{ gridColumn: "1 / -1" }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Bill image
                </Typography>
                <Box
                  component="img"
                  src={`data:${bill.file_type};base64,${bill.file_data}`}
                  alt="Bill"
                  sx={{ maxWidth: 300, maxHeight: 300, objectFit: "contain", border: 1, borderColor: "divider" }}
                />
              </Box>
            )}
            <Stack direction="row" spacing={2} sx={{ gridColumn: "1 / -1", pt: 1 }}>
              <Button variant="contained" onClick={() => navigate(`/app/transaction/${transactionId}/edit`)}>
                Edit
              </Button>
              <Button onClick={() => navigate("/app/transaction")}>Back to list</Button>
            </Stack>
          </Box>
        </Paper>
      )}
    </>
  );
}
