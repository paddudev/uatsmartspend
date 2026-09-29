import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
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
import { deleteCategoryMaster, listCategoryMasters, listProductsAndServices } from "../api/masters";
import ConfirmDialog from "../components/ConfirmDialog";
import { collectOptions, matchesAny, matchesSearch, uniqueOptions } from "../utils/listFilters";

export default function CategoryMasters() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [products, setProducts] = useState([]);
  const [nameSearch, setNameSearch] = useState("");
  const [commonMasterFilter, setCommonMasterFilter] = useState([]);
  const [brandFilter, setBrandFilter] = useState([]);

  // Categories have no brands of their own; a category carries the brands of
  // the products/services mapped to it.
  const brandIdsByCategory = useMemo(() => {
    const map = new Map();
    products.forEach((p) =>
      (p.categories || []).forEach((c) => {
        const ids = map.get(c.id) || new Set();
        (p.brands || []).forEach((b) => ids.add(b.id));
        map.set(c.id, ids);
      })
    );
    return map;
  }, [products]);

  const commonMasterOptions = useMemo(
    () =>
      uniqueOptions(
        items.filter((c) => c.commonmaster_fk).map((c) => ({ id: c.commonmaster_fk, name: c.commonmaster_name || "—" }))
      ),
    [items]
  );
  const brandOptions = useMemo(
    () => collectOptions(products.filter((p) => (p.categories || []).length > 0), "brands"),
    [products]
  );
  const filteredItems = items.filter(
    (item) =>
      matchesSearch(item.name, nameSearch) &&
      matchesAny([item.commonmaster_fk], commonMasterFilter) &&
      matchesAny([...(brandIdsByCategory.get(item.id) || [])], brandFilter)
  );
  const filtersActive = nameSearch.trim() !== "" || commonMasterFilter.length > 0 || brandFilter.length > 0;

  function clearFilters() {
    setNameSearch("");
    setCommonMasterFilter([]);
    setBrandFilter([]);
  }

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const [data, allProducts] = await Promise.all([listCategoryMasters(), listProductsAndServices()]);
      setItems(data);
      setProducts(allProducts);
    } catch {
      setError("Unable to load category masters.");
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
      await deleteCategoryMaster(id);
      loadItems();
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to delete category master.");
    }
  }

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2, width: "100%" }}>
        <Typography variant="h4">Category Master</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/app/master/category/new")}>
          Add Category Master
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
            options={commonMasterOptions}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={commonMasterFilter}
            onChange={(e, newValue) => setCommonMasterFilter(newValue)}
            renderInput={(params) => <TextField {...params} label="Common Master" placeholder="All common masters" />}
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
            {filtersActive ? `${filteredItems.length} of ${items.length}` : `${items.length}`} categories
          </Typography>
        </Stack>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Common Master</TableCell>
              <TableCell>Tag</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {filtersActive ? "No category masters match these filters." : "No category masters found."}
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
                <TableCell>{item.commonmaster_name || "—"}</TableCell>
                <TableCell>{item.tag}</TableCell>
                <TableCell>{item.owner_username || "—"}</TableCell>
                <TableCell align="right">
                  <Box className="row-actions">
                    <Tooltip title="View details">
                      <IconButton size="small" onClick={() => navigate(`/app/master/category/${item.id}`)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit details">
                      <IconButton size="small" onClick={() => navigate(`/app/master/category/${item.id}/edit`)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete category master">
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
        title="Delete category master"
        message={`Delete "${pendingDelete?.name}"? This can't be undone.`}
        confirmColor="error"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
