import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import { deleteProductsAndServices, listProductsAndServices } from "../api/masters";
import ConfirmDialog from "../components/ConfirmDialog";
import { collectOptions, matchesAny, matchesSearch } from "../utils/listFilters";

const idsOf = (links) => (links || []).map((link) => link.id);

export default function ProductsAndServicesList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [nameSearch, setNameSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [brandFilter, setBrandFilter] = useState([]);

  const categoryOptions = useMemo(() => collectOptions(items, "categories"), [items]);
  const brandOptions = useMemo(() => collectOptions(items, "brands"), [items]);
  const filteredItems = items.filter(
    (item) =>
      matchesSearch(item.name, nameSearch) &&
      matchesAny(idsOf(item.categories), categoryFilter) &&
      matchesAny(idsOf(item.brands), brandFilter)
  );
  const filtersActive = nameSearch.trim() !== "" || categoryFilter.length > 0 || brandFilter.length > 0;

  function clearFilters() {
    setNameSearch("");
    setCategoryFilter([]);
    setBrandFilter([]);
  }

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const data = await listProductsAndServices();
      setItems(data);
    } catch {
      setError("Unable to load products and services.");
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
      await deleteProductsAndServices(id);
      loadItems();
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to delete product/service.");
    }
  }

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2, width: "100%" }}>
        <Typography variant="h4">Products &amp; Services</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/app/master/products/new")}>
          Add Product/Service
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2.5, mb: 2 }}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", alignItems: "center", rowGap: 2 }}>
          <TextField
            size="small"
            label="Name"
            placeholder="Search by name"
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ minWidth: 220, flex: 1 }}
          />
          <Autocomplete
            multiple
            size="small"
            options={categoryOptions}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={categoryFilter}
            onChange={(e, newValue) => setCategoryFilter(newValue)}
            renderInput={(params) => <TextField {...params} label="Category" placeholder="All categories" />}
            sx={{ minWidth: 260, flex: 1 }}
          />
          <Autocomplete
            multiple
            size="small"
            options={brandOptions}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={brandFilter}
            onChange={(e, newValue) => setBrandFilter(newValue)}
            renderInput={(params) => <TextField {...params} label="Brand" placeholder="All brands" />}
            sx={{ minWidth: 260, flex: 1 }}
          />
          {filtersActive && <Button onClick={clearFilters}>Clear filter</Button>}
          <Typography variant="body2" color="text.secondary">
            {filtersActive ? `${filteredItems.length} of ${items.length}` : `${items.length}`} products/services
          </Typography>
        </Stack>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Categories</TableCell>
              <TableCell>Brands</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {filtersActive ? "No products or services match these filters." : "No products or services found."}
                </TableCell>
              </TableRow>
            )}
            {filteredItems.map((item) => (
              <TableRow
                key={item.id}
                hover
                sx={{
                  "& .row-actions": { opacity: 0, transition: "opacity 0.15s" },
                  "&:hover .row-actions": { opacity: 1 },
                }}
              >
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>
                  {item.categories && item.categories.length > 0 ? (
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
                      {item.categories.map((c) => (
                        <Chip key={c.id} label={c.name} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  {item.brands && item.brands.length > 0 ? (
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
                      {item.brands.map((b) => (
                        <Chip key={b.id} label={b.name} size="small" />
                      ))}
                    </Stack>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{item.owner_username || "—"}</TableCell>
                <TableCell align="right">
                  <Box className="row-actions">
                    <Tooltip title="View details">
                      <IconButton size="small" onClick={() => navigate(`/app/master/products/${item.id}`)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit details">
                      <IconButton size="small" onClick={() => navigate(`/app/master/products/${item.id}/edit`)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete product/service">
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
        title="Delete product/service"
        message={`Delete "${pendingDelete?.name}"? This can't be undone.`}
        confirmColor="error"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
