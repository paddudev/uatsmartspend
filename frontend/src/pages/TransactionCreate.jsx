import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { createTransaction } from "../api/transactions";
import { useAuth } from "../auth/AuthContext";
import TransactionCategoryFields from "../components/TransactionCategoryFields";
import { getTransactionDateRange } from "../utils/transactionDateRange";
import { useNotification } from "../notifications/NotificationContext";

const emptyForm = {
  amount: "",
  transaction_date: "",
  commonmaster_fk: "",
  categorymaster_fk: "",
  products_services_fk: "",
  note: "",
};

const dateRange = getTransactionDateRange();

export default function TransactionCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifySuccess } = useNotification();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.commonmaster_fk) {
      setError("Select a common master.");
      return;
    }
    if (!form.products_services_fk) {
      setError("Select a product/service.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await createTransaction({
        amount: form.amount,
        transaction_date: form.transaction_date,
        userid_fk: user.id,
        products_services_fk: form.products_services_fk,
        note: form.note,
      });
      notifySuccess("Transaction created successfully.");
      navigate("/app/transaction");
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to create transaction.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Add transaction
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
              label="Amount"
              type="number"
              value={form.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              required
              fullWidth
              slotProps={{ htmlInput: { step: "0.01" } }}
            />
            <TextField
              label="Transaction date"
              type="date"
              value={form.transaction_date}
              onChange={(e) => handleChange("transaction_date", e.target.value)}
              required
              fullWidth
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { min: dateRange.min, max: dateRange.max },
              }}
              helperText={`Between ${dateRange.min} and ${dateRange.max}`}
            />

            <TransactionCategoryFields
              commonMasterId={form.commonmaster_fk}
              categoryId={form.categorymaster_fk}
              productId={form.products_services_fk}
              onCommonMasterChange={(value) => handleChange("commonmaster_fk", value)}
              onCategoryChange={(value) => handleChange("categorymaster_fk", value)}
              onProductChange={(value) => handleChange("products_services_fk", value)}
            />

            <TextField
              label="Note"
              value={form.note}
              onChange={(e) => handleChange("note", e.target.value)}
              fullWidth
              sx={{ gridColumn: "1 / -1" }}
            />

            <Stack direction="row" spacing={2} sx={{ gridColumn: "1 / -1" }}>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Creating..." : "Create transaction"}
              </Button>
              <Button onClick={() => navigate("/app/transaction")}>Cancel</Button>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </>
  );
}
