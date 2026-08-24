import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const MAX_IP_ADDRESSES = 30;
const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export default function NetworkAccessFields({
  networkAccess,
  ipAddresses,
  onNetworkAccessChange,
  onIpAddressesChange,
}) {
  const [ipInput, setIpInput] = useState("");
  const [ipError, setIpError] = useState("");

  function handleAddIp() {
    const candidate = ipInput.trim();
    if (!candidate) return;
    if (!IPV4_REGEX.test(candidate)) {
      setIpError("Enter a valid IPv4 address, e.g. 192.168.1.10");
      return;
    }
    if (ipAddresses.includes(candidate)) {
      setIpError("That IP address is already in the list");
      return;
    }
    if (ipAddresses.length >= MAX_IP_ADDRESSES) {
      setIpError(`You can add up to ${MAX_IP_ADDRESSES} IP addresses`);
      return;
    }
    setIpError("");
    setIpInput("");
    onIpAddressesChange([...ipAddresses, candidate]);
  }

  function handleRemoveIp(ip) {
    onIpAddressesChange(ipAddresses.filter((existing) => existing !== ip));
  }

  return (
    <Stack spacing={2}>
      <FormControl>
        <FormLabel id="network-access-label">Network access</FormLabel>
        <RadioGroup
          aria-labelledby="network-access-label"
          row
          value={networkAccess}
          onChange={(e) => onNetworkAccessChange(e.target.value)}
        >
          <FormControlLabel value="open" control={<Radio />} label="Open network" />
          <FormControlLabel value="limited" control={<Radio />} label="Limited network" />
        </RadioGroup>
      </FormControl>

      {networkAccess === "limited" && (
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Add up to {MAX_IP_ADDRESSES} IP addresses allowed to log in as this user.
          </Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="IP address"
              value={ipInput}
              onChange={(e) => {
                setIpInput(e.target.value);
                setIpError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddIp();
                }
              }}
              placeholder="192.168.1.10"
              fullWidth
            />
            <Button variant="outlined" onClick={handleAddIp}>
              Add
            </Button>
          </Stack>
          {ipError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {ipError}
            </Alert>
          )}
          {ipAddresses.length === 0 ? (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              At least one IP address is required for limited network access.
            </Typography>
          ) : (
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.5 }}>
              {ipAddresses.map((ip) => (
                <Chip key={ip} label={ip} onDelete={() => handleRemoveIp(ip)} size="small" />
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Stack>
  );
}
