import { useEffect, useState } from "react";
import {
  Alert,
  Box,
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
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { listTransactions } from "../api/transactions";
import { exportToCsv, exportToPdf } from "../utils/exportReport";

const COLUMNS = ["Transaction Date", "Transaction Type", "Category", "Product/Services", "Amount"];

export default function CategoryWiseTransactionsReport() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listTransactions()
      .then((data) => {
        const sorted = [...data].sort((a, b) => (a.transaction_date < b.transaction_date ? 1 : -1));
        setItems(sorted);
      })
      .catch(() => setError("Unable to load report data."))
      .finally(() => setLoading(false));
  }, []);

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
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} align="center">
                  No transactions found.
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
