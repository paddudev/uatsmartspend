import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
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
import { deleteUsergroup, listUsergroups } from "../api/usergroups";
import ConfirmDialog from "../components/ConfirmDialog";

export default function UserGroups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  async function loadGroups() {
    setLoading(true);
    setError("");
    try {
      const data = await listUsergroups();
      setGroups(data);
    } catch {
      setError("Unable to load user groups.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroups();
  }, []);

  async function handleDeleteConfirmed() {
    const groupId = pendingDelete.id;
    setPendingDelete(null);
    try {
      await deleteUsergroup(groupId);
      loadGroups();
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to delete user group.");
    }
  }

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2, width: "100%" }}>
        <Typography variant="h4">User Groups</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/app/account/groups/new")}>
          Add User Group
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
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Tag</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && groups.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No user groups found.
                </TableCell>
              </TableRow>
            )}
            {groups.map((g) => (
              <TableRow
                key={g.id}
                hover
                sx={{
                  "& .row-actions": { opacity: 0, transition: "opacity 0.15s" },
                  "&:hover .row-actions": { opacity: 1 },
                }}
              >
                <TableCell>{g.name}</TableCell>
                <TableCell>{g.description}</TableCell>
                <TableCell>{g.owner_username || "—"}</TableCell>
                <TableCell>{g.tag}</TableCell>
                <TableCell align="right">
                  <Box className="row-actions">
                    <Tooltip title="View details">
                      <IconButton size="small" onClick={() => navigate(`/app/account/groups/${g.id}`)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit details">
                      <IconButton size="small" onClick={() => navigate(`/app/account/groups/${g.id}/edit`)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete user group">
                      <IconButton size="small" onClick={() => setPendingDelete(g)}>
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
        title="Delete user group"
        message={`Delete "${pendingDelete?.name}"? This can't be undone.`}
        confirmColor="error"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
