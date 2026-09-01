import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Stack,
  Typography,
} from "@mui/material";
import { listCapabilities } from "../api/usergroups";

export default function CapabilitySelect({ selectedIds, onChange }) {
  const [capabilities, setCapabilities] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listCapabilities()
      .then(setCapabilities)
      .catch(() => setError("Unable to load capabilities."));
  }, []);

  const groups = useMemo(() => {
    const byTag = new Map();
    capabilities.forEach((cap) => {
      const key = cap.tag || "Other";
      if (!byTag.has(key)) byTag.set(key, []);
      byTag.get(key).push(cap);
    });
    return [...byTag.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [capabilities]);

  function toggle(id) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((existing) => existing !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <Stack spacing={1.5}>
      <FormLabel>Capabilities</FormLabel>
      {error && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}
      {groups.map(([tag, caps]) => (
        <Box key={tag}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: "capitalize" }}>
            {tag}
          </Typography>
          <FormGroup row>
            {caps.map((cap) => (
              <FormControlLabel
                key={cap.id}
                sx={{ width: { xs: "100%", sm: "50%", md: "33%" }, mr: 0 }}
                control={
                  <Checkbox
                    checked={selectedIds.includes(cap.id)}
                    onChange={() => toggle(cap.id)}
                  />
                }
                label={cap.description || cap.name}
              />
            ))}
          </FormGroup>
        </Box>
      ))}
      {capabilities.length === 0 && !error && (
        <Typography variant="body2" color="text.secondary">
          No capabilities defined yet.
        </Typography>
      )}
    </Stack>
  );
}
