import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { deleteTransaction, listTransactions } from "../api/transactions";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Transactions() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const data = await listTransactions();
      setItems(data);
    } catch {
      setError("Unable to load transactions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleDeleteConfirmed() {
    const id = pendingDelete.id;
    setPendingDelete(null);
    try {
      await deleteTransaction(id);
      loadItems();
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to delete transaction.");
    }
  }

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2, width: "100%" }}>
        <Typography variant="h4">Transactions</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/app/transaction/new")}>
          Add Transaction
        </Button>
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
              <TableCell>Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Product/Service</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow
                key={item.id}
                hover
                sx={{
                  "& .row-actions": { opacity: 0, transition: "opacity 0.15s" },
                  "&:hover .row-actions": { opacity: 1 },
                }}
              >
                <TableCell>{item.transaction_date}</TableCell>
                <TableCell>{item.amount}</TableCell>
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
                <TableCell>{item.owner_username || "—"}</TableCell>
                <TableCell align="right">
                  <Box className="row-actions">
                    <Tooltip title="View details">
                      <IconButton size="small" onClick={() => navigate(`/app/transaction/${item.id}`)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit details">
                      <IconButton size="small" onClick={() => navigate(`/app/transaction/${item.id}/edit`)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete transaction">
                      <IconButton size="small" onClick={() => setPendingDelete(item)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete transaction"
        message={`Delete this transaction of ${pendingDelete?.amount} on ${pendingDelete?.transaction_date}? This can't be undone.`}
        confirmColor="error"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
