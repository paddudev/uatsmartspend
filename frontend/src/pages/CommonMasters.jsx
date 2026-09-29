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
import { deleteCommonMaster, listCommonMasters } from "../api/masters";
import ConfirmDialog from "../components/ConfirmDialog";
import { matchesAny, matchesSearch, uniqueOptions } from "../utils/listFilters";

// Tags are free text, so each distinct tag is its own option; untagged rows
// share the "" option so they can still be picked out.
const tagOption = (tag) => ({ id: tag || "", name: tag || "(No tag)" });

export default function CommonMasters() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [nameSearch, setNameSearch] = useState("");
  const [tagFilter, setTagFilter] = useState([]);

  const tagOptions = useMemo(() => uniqueOptions(items.map((item) => tagOption(item.tag))), [items]);
  const filteredItems = items.filter(
    (item) => matchesSearch(item.name, nameSearch) && matchesAny([tagOption(item.tag).id], tagFilter)
  );
  const filtersActive = nameSearch.trim() !== "" || tagFilter.length > 0;

  function clearFilters() {
    setNameSearch("");
    setTagFilter([]);
  }

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const data = await listCommonMasters();
      setItems(data);
    } catch {
      setError("Unable to load common masters.");
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
      await deleteCommonMaster(id);
      loadItems();
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to delete common master.");
    }
  }

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2, width: "100%" }}>
        <Typography variant="h4">Common Master</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/app/master/common/new")}>
          Add Common Master
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
            options={tagOptions}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={tagFilter}
            onChange={(e, newValue) => setTagFilter(newValue)}
            renderInput={(params) => <TextField {...params} label="Tag" placeholder="All tags" />}
            sx={{ minWidth: 260, flex: 1 }}
          />
          {filtersActive && <Button onClick={clearFilters}>Clear filter</Button>}
          <Typography variant="body2" color="text.secondary">
            {filtersActive ? `${filteredItems.length} of ${items.length}` : `${items.length}`} common masters
          </Typography>
        </Stack>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Tag</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {filtersActive ? "No common masters match these filters." : "No common masters found."}
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
                <TableCell>{item.tag}</TableCell>
                <TableCell>{item.owner_username || "—"}</TableCell>
                <TableCell align="right">
                  <Box className="row-actions">
                    <Tooltip title="View details">
                      <IconButton size="small" onClick={() => navigate(`/app/master/common/${item.id}`)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit details">
                      <IconButton size="small" onClick={() => navigate(`/app/master/common/${item.id}/edit`)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete common master">
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
        title="Delete common master"
        message={`Delete "${pendingDelete?.name}"? This can't be undone.`}
        confirmColor="error"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
