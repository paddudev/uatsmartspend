import apiClient from "./client";

function buildQuery(fields) {
  const params = new URLSearchParams();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    params.append(key, value);
  });
  return params.toString();
}

export function listUsergroups() {
  return apiClient.get("/usergroup/").then((res) => res.data);
}

export function getUsergroup(usergroupId) {
  return apiClient.get(`/usergroup/${usergroupId}`).then((res) => res.data);
}

export function createUsergroup({ name, description, tag, userid_fk, capability_ids }) {
  const query = buildQuery({ name, description, tag, userid_fk });
  return apiClient
    .post(`/usergroup/?${query}`, { capability_ids })
    .then((res) => res.data);
}

export function updateUsergroup(usergroupId, { name, description, tag, userid_fk, capability_ids }) {
  const query = buildQuery({ name, description, tag, userid_fk });
  const hasCapabilities = capability_ids !== undefined;
  return apiClient
    .put(`/usergroup/${usergroupId}?${query}`, hasCapabilities ? { capability_ids } : undefined)
    .then((res) => res.data);
}

export function deleteUsergroup(usergroupId) {
  return apiClient.delete(`/usergroup/${usergroupId}`).then((res) => res.data);
}

export function listCapabilities() {
  return apiClient.get("/capabilitymaster/").then((res) => res.data);
}
