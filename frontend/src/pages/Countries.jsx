import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
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
import FlagIcon from "@mui/icons-material/Flag";
import { deleteCountry, listCountries } from "../api/geography";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Countries() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const data = await listCountries();
      setItems(data);
    } catch {
      setError("Unable to load countries.");
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
      await deleteCountry(id);
      loadItems();
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to delete country.");
    }
  }

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2, width: "100%" }}>
        <Typography variant="h4">Country</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/app/geography/country/new")}>
          Add Country
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
              <TableCell>Flag</TableCell>
              <TableCell>Country</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Phone Code</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No countries found.
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
                <TableCell>
                  <Avatar
                    variant="rounded"
                    src={item.flag ? `data:image/png;base64,${item.flag}` : undefined}
                    sx={{ width: 28, height: 28 }}
                  >
                    <FlagIcon fontSize="small" />
                  </Avatar>
                </TableCell>
                <TableCell>{item.country}</TableCell>
                <TableCell>{item.country_code}</TableCell>
                <TableCell>{item.country_phone_code}</TableCell>
                <TableCell>
                  {item.currency?.currency_code
                    ? `${item.currency.currency_code}${item.currency.currency_symbol ? ` (${item.currency.currency_symbol})` : ""}`
                    : "—"}
                </TableCell>
                <TableCell align="right">
                  <Box className="row-actions">
                    <Tooltip title="View details">
                      <IconButton size="small" onClick={() => navigate(`/app/geography/country/${item.id}`)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit details">
                      <IconButton size="small" onClick={() => navigate(`/app/geography/country/${item.id}/edit`)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete country">
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
        title="Delete country"
        message={`Delete "${pendingDelete?.country}"? This can't be undone.`}
        confirmColor="error"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
