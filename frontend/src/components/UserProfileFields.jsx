import { useEffect, useState } from "react";
import { Avatar, Button, MenuItem, Stack, TextField } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import { listCommonMasters } from "../api/masters";
import { listCountries, listPincodes } from "../api/geography";
import { fileToBase64 } from "../utils/fileToBase64";

export default function UserProfileFields({
  profilePhoto,
  onProfilePhotoChange,
  genderId,
  onGenderChange,
  countryId,
  onCountryChange,
  pincodeId,
  onPincodeChange,
}) {
  const [genders, setGenders] = useState([]);
  const [countries, setCountries] = useState([]);
  const [pincodes, setPincodes] = useState([]);

  useEffect(() => {
    listCommonMasters().then((rows) => setGenders(rows.filter((r) => r.tag === "gender")));
    listCountries().then(setCountries);
    listPincodes().then(setPincodes);
  }, []);

  const selectedCountry = countries.find((c) => c.id === countryId);
  const visiblePincodes = selectedCountry
    ? pincodes.filter((p) => p.country_name === selectedCountry.country)
    : pincodes;
  const selectedPincode = pincodes.find((p) => p.id === pincodeId);

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    onProfilePhotoChange(base64);
  }

  function handleCountryChange(value) {
    onCountryChange(value ? Number(value) : "");
    onPincodeChange("");
  }

  return (
    <>
      <Stack direction="row" spacing={2} sx={{ gridColumn: "1 / -1", alignItems: "center" }}>
        <Avatar
          src={profilePhoto ? `data:image/png;base64,${profilePhoto}` : undefined}
          sx={{ width: 56, height: 56 }}
        >
          <PersonIcon />
        </Avatar>
        <Button variant="outlined" component="label">
          Upload photo
          <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
        </Button>
      </Stack>

      <TextField
        select
        label="Gender"
        value={genderId || ""}
        onChange={(e) => onGenderChange(e.target.value ? Number(e.target.value) : "")}
        fullWidth
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {genders.map((g) => (
          <MenuItem key={g.id} value={g.id}>
            {g.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Country"
        value={countryId || ""}
        onChange={(e) => handleCountryChange(e.target.value)}
        fullWidth
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {countries.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.country}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Pincode"
        value={pincodeId || ""}
        onChange={(e) => onPincodeChange(e.target.value ? Number(e.target.value) : "")}
        fullWidth
        disabled={!countryId}
        helperText={!countryId ? "Select a country first" : ""}
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {visiblePincodes.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.pincode}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="City"
        value={selectedPincode?.city || ""}
        fullWidth
        slotProps={{ input: { readOnly: true } }}
      />
      <TextField
        label="State"
        value={selectedPincode?.state_name || ""}
        fullWidth
        slotProps={{ input: { readOnly: true } }}
      />
    </>
  );
}
