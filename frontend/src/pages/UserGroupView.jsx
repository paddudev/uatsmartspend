import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { getUsergroup, listCapabilities } from "../api/usergroups";

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

export default function UserGroupView() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [capabilities, setCapabilities] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getUsergroup(groupId), listCapabilities()])
      .then(([g, caps]) => {
        setGroup(g);
        setCapabilities(caps);
      })
      .catch(() => setError("Unable to load user group."));
  }, [groupId]);

  const selectedCapabilities = capabilities.filter((cap) => group?.capability_ids?.includes(cap.id));

  return (
    <>
      <Typography variant="h4" gutterBottom>
        User group details
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {group && (
        <Paper sx={{ p: 3, width: "100%" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
              gap: 2,
            }}
          >
            <Field label="Name" value={group.name} />
            <Field label="Description" value={group.description || "—"} />
            <Field label="Tag" value={group.tag || "—"} />
            <Field label="Owner" value={group.owner_username || "—"} />
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Capabilities
              </Typography>
              {selectedCapabilities.length ? (
                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
                  {selectedCapabilities.map((cap) => (
                    <Chip key={cap.id} label={cap.description || cap.name} size="small" />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  None
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={2} sx={{ gridColumn: "1 / -1", pt: 1 }}>
              <Button variant="contained" onClick={() => navigate(`/app/account/groups/${groupId}/edit`)}>
                Edit
              </Button>
              <Button onClick={() => navigate("/app/account/groups")}>Back to list</Button>
            </Stack>
          </Box>
        </Paper>
      )}
    </>
  );
}
