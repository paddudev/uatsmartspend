import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { listTransactions } from "../api/transactions";
import { exportToCsv, exportToPdf } from "../utils/exportReport";
import { useAuth } from "../auth/AuthContext";
import { maxToDateForRange, toIsoDate } from "../utils/transactionDateRange";

const COLUMNS = ["Transaction Date", "Transaction Type", "Category", "Product/Services", "Amount"];
const MAX_RANGE_MONTHS = 6;

function defaultFromDate() {
  const today = new Date();
  return toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1));
}

function defaultToDate() {
  return toIsoDate(new Date());
}

export default function CategoryWiseTransactionsReport() {
  const { user } = useAuth();
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const maxToDate = fromDate ? maxToDateForRange(fromDate, MAX_RANGE_MONTHS) : undefined;

  const rangeError = useMemo(() => {
    if (!fromDate || !toDate) {
      return "From date and to date are required.";
    }
    if (fromDate > toDate) {
      return "From date must not be after to date.";
    }
    if (maxToDate && toDate > maxToDate) {
      return `Date range cannot exceed ${MAX_RANGE_MONTHS} months.`;
    }
    return "";
  }, [fromDate, toDate, maxToDate]);

  useEffect(() => {
    if (rangeError || !user) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError("");
    listTransactions({ userid_fk: user.id, from_date: fromDate, to_date: toDate })
      .then((data) => {
        const sorted = [...data].sort((a, b) => (a.transaction_date < b.transaction_date ? 1 : -1));
        setItems(sorted);
      })
      .catch((err) => setError(err?.response?.data?.detail || "Unable to load report data."))
      .finally(() => setLoading(false));
  }, [fromDate, toDate, rangeError, user]);

  function toRows() {
    return items.map((item) => [
      item.transaction_date,
      item.commonmaster_name || "",
      item.category_name || "",
      item.product_name || "",
      item.amount,
    ]);
  }

  function handleExportCsv() {
    exportToCsv("category-wise-transactions.csv", COLUMNS, toRows());
  }

  function handleExportPdf() {
    exportToPdf("category-wise-transactions.pdf", "Category Wise Transactions", COLUMNS, toRows());
  }

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2, width: "100%" }}>
        <Typography variant="h4">Category Wise Transactions</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCsv} disabled={!items.length}>
            Export CSV
          </Button>
          <Button variant="contained" startIcon={<PictureAsPdfIcon />} onClick={handleExportPdf} disabled={!items.length}>
            Export PDF
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 2.5, mb: 2 }}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", alignItems: "flex-start" }}>
          <TextField
            label="From date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="To date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            required
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: fromDate, max: maxToDate } }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
            Range can be up to {MAX_RANGE_MONTHS} months. Showing your own transactions only.
          </Typography>
        </Stack>
      </Paper>

      {rangeError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {rangeError}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableCell key={col}>{col}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && !rangeError && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} align="center">
                  No transactions found for this range.
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{item.transaction_date}</TableCell>
                <TableCell>
                  {item.commonmaster_name && (
                    <Chip
                      label={item.commonmaster_name}
                      size="small"
                      color={item.commonmaster_name === "Gains" ? "success" : "default"}
                    />
                  )}
                </TableCell>
                <TableCell>{item.category_name || "—"}</TableCell>
                <TableCell>{item.product_name || "—"}</TableCell>
                <TableCell>{item.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
