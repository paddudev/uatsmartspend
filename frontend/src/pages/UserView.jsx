import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { getUser } from "../api/users";

function Field({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  );
}

export default function UserView() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getUser(userId)
      .then(setUser)
      .catch(() => setError("Unable to load user."));
  }, [userId]);

  return (
    <>
      <Typography variant="h4" gutterBottom>
        User details
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {user && (
        <Paper sx={{ p: 3, maxWidth: 480 }}>
          <Stack spacing={2}>
            <Field label="Username" value={user.username} />
            <Field label="Full name" value={user.full_name} />
            <Field label="Email" value={user.email} />
            <Field label="User group" value={user.usergroup_description || "—"} />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Status
              </Typography>
              <Chip
                label={user.is_active ? "Active" : "Inactive"}
                color={user.is_active ? "success" : "default"}
                size="small"
              />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Network access
              </Typography>
              <Chip
                label={user.network_access === "limited" ? "Limited network" : "Open network"}
                color={user.network_access === "limited" ? "warning" : "default"}
                size="small"
              />
            </Box>
            {user.network_access === "limited" && (
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Allowed IP addresses
                </Typography>
                {user.ip_addresses?.length ? (
                  <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
                    {user.ip_addresses.map((ip) => (
                      <Chip key={ip} label={ip} size="small" />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    None
                  </Typography>
                )}
              </Box>
            )}
            <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
              <Button variant="contained" onClick={() => navigate(`/app/account/${userId}/edit`)}>
                Edit
              </Button>
              <Button onClick={() => navigate("/app/account")}>Back to list</Button>
            </Stack>
          </Stack>
        </Paper>
      )}
    </>
  );
}
