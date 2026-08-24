import { useEffect, useState } from "react";
import {
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

  function toggle(id) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((existing) => existing !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <Stack spacing={1}>
      <FormLabel>Capabilities</FormLabel>
      {error && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}
      <FormGroup>
        {capabilities.map((cap) => (
          <FormControlLabel
            key={cap.id}
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
      {capabilities.length === 0 && !error && (
        <Typography variant="body2" color="text.secondary">
          No capabilities defined yet.
        </Typography>
      )}
    </Stack>
  );
}
