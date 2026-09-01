import apiClient from "./client";

function buildQuery(fields) {
  const params = new URLSearchParams();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    params.append(key, value);
  });
  return params.toString();
}

// Country
export function listCountries() {
  return apiClient.get("/country/").then((res) => res.data);
}
export function getCountry(id) {
  return apiClient.get(`/country/${id}`).then((res) => res.data);
}
export function createCountry({ country, country_code, country_phone_code, flag, currency }) {
  const query = buildQuery({ country, country_code, country_phone_code });
  return apiClient
    .post(`/country/?${query}`, { flag: flag ?? null, currency: currency ?? null })
    .then((res) => res.data);
}
export function updateCountry(id, { country, country_code, country_phone_code, flag, currency }) {
  const query = buildQuery({ country, country_code, country_phone_code });
  const body = {};
  if (flag !== undefined) body.flag = flag;
  if (currency !== undefined) body.currency = currency;
  return apiClient.put(`/country/${id}?${query}`, body).then((res) => res.data);
}
export function deleteCountry(id) {
  return apiClient.delete(`/country/${id}`).then((res) => res.data);
}

// State
export function listStates() {
  return apiClient.get("/state/").then((res) => res.data);
}
export function getState(id) {
  return apiClient.get(`/state/${id}`).then((res) => res.data);
}
export function createState(fields) {
  return apiClient.post(`/state/?${buildQuery(fields)}`).then((res) => res.data);
}
export function updateState(id, fields) {
  return apiClient.put(`/state/${id}?${buildQuery(fields)}`).then((res) => res.data);
}
export function deleteState(id) {
  return apiClient.delete(`/state/${id}`).then((res) => res.data);
}

// District
export function listDistricts() {
  return apiClient.get("/district/").then((res) => res.data);
}
export function getDistrict(id) {
  return apiClient.get(`/district/${id}`).then((res) => res.data);
}
export function createDistrict({ city, district, state_fk, tag }) {
  const query = buildQuery({ city, district, state_fk });
  return apiClient.post(`/district/?${query}`, tag ?? null).then((res) => res.data);
}
export function updateDistrict(id, { city, district, state_fk, tag }) {
  const query = buildQuery({ city, district, state_fk });
  const hasTag = tag !== undefined;
  return apiClient
    .put(`/district/${id}?${query}`, hasTag ? tag : undefined)
    .then((res) => res.data);
}
export function deleteDistrict(id) {
  return apiClient.delete(`/district/${id}`).then((res) => res.data);
}

// Pincode
export function listPincodes() {
  return apiClient.get("/pincode/").then((res) => res.data);
}
export function getPincode(id) {
  return apiClient.get(`/pincode/${id}`).then((res) => res.data);
}
export function createPincode(fields) {
  return apiClient.post(`/pincode/?${buildQuery(fields)}`).then((res) => res.data);
}
export function updatePincode(id, fields) {
  return apiClient.put(`/pincode/${id}?${buildQuery(fields)}`).then((res) => res.data);
}
export function deletePincode(id) {
  return apiClient.delete(`/pincode/${id}`).then((res) => res.data);
}
