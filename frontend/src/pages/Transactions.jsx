import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Fab,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Zoom,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { deleteTransaction, listTransactions } from "../api/transactions";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../auth/AuthContext";
import { maxToDateForRange } from "../utils/transactionDateRange";

const PAGE_SIZE = 50;
const MAX_RANGE_MONTHS = 6;

export default function Transactions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [missingBrandOnly, setMissingBrandOnly] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const offsetRef = useRef(0);
  const sentinelRef = useRef(null);

  const maxToDate = fromDate ? maxToDateForRange(fromDate, MAX_RANGE_MONTHS) : undefined;
  const rangeError =
    (fromDate && !toDate) || (!fromDate && toDate)
      ? "Select both a from date and a to date to filter by range."
      : fromDate && toDate && fromDate > toDate
        ? "From date must not be after to date."
        : fromDate && toDate && maxToDate && toDate > maxToDate
          ? `Date range cannot exceed ${MAX_RANGE_MONTHS} months.`
          : "";

  const loadPage = useCallback(
    async (reset) => {
      if (rangeError) return;
      const offset = reset ? 0 : offsetRef.current;
      if (reset) {
        setLoading(true);
        setItems([]);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      setError("");
      try {
        const filters = { userid_fk: user.id, limit: PAGE_SIZE, offset };
        if (fromDate && toDate) {
          filters.from_date = fromDate;
          filters.to_date = toDate;
        }
        if (missingBrandOnly) {
          filters.missing_brand = true;
        }
        const data = await listTransactions(filters);
        setItems((prev) => (reset ? data : [...prev, ...data]));
        offsetRef.current = offset + data.length;
        setHasMore(data.length === PAGE_SIZE);
      } catch {
        setError("Unable to load transactions.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user.id, fromDate, toDate, missingBrandOnly, rangeError]
  );

  useEffect(() => {
    loadPage(true);
  }, [loadPage]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadPage(false);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadPage]);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 400);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDeleteConfirmed() {
    const id = pendingDelete.id;
    setPendingDelete(null);
    try {
      await deleteTransaction(id);
      loadPage(true);
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to delete transaction.");
    }
  }

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2, width: "100%" }}>
        <Typography variant="h4">Transactions</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => navigate("/app/transaction/bill-upload")}>
            Upload Bill
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/app/transaction/new")}>
            Add Transaction
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
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="To date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: fromDate || undefined, max: maxToDate } }}
          />
          {(fromDate || toDate) && (
            <Button
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              sx={{ alignSelf: "center" }}
            >
              Clear filter
            </Button>
          )}
          <FormControlLabel
            sx={{ alignSelf: "center" }}
            control={
              <Switch
                checked={missingBrandOnly}
                onChange={(e) => setMissingBrandOnly(e.target.checked)}
              />
            }
            label="Missing brand only"
          />
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
            Leave blank to see all transactions. Range can be up to {MAX_RANGE_MONTHS} months.
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
              <TableCell>Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Product/Service</TableCell>
              <TableCell>Brand</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Source</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && !rangeError && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">
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
                <TableCell>{item.brand_name || "—"}</TableCell>
                <TableCell>{item.owner_username || "—"}</TableCell>
                <TableCell>
                  <Chip
                    label={item.source === "ai" ? "AI" : item.source === "draft" ? "Draft" : "Manual"}
                    size="small"
                    color={item.source === "ai" ? "success" : item.source === "draft" ? "warning" : "default"}
                  />
                </TableCell>
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
            {!loading && !rangeError && hasMore && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ border: 0, py: 2 }}>
                  <Box ref={sentinelRef}>
                    {loadingMore && <CircularProgress size={24} />}
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Zoom in={showScrollTop}>
        <Fab
          color="primary"
          size="medium"
          onClick={scrollToTop}
          aria-label="Go to top"
          sx={{ position: "fixed", bottom: 24, right: 24 }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Zoom>

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
