import apiClient from "./client";

// FastAPI expects repeated keys for list query params (?ip_addresses=a&ip_addresses=b),
// but axios's default params serializer emits bracket notation (?ip_addresses[]=a&...),
// which FastAPI won't bind. Build the query string manually so arrays round-trip correctly.
function buildQuery(fields) {
  const params = new URLSearchParams();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else {
      params.append(key, value);
    }
  });
  return params.toString();
}

export function login(username, password) {
  return apiClient
    .post("/login", null, { params: { username, password } })
    .then((res) => res.data);
}

export function listUsers() {
  return apiClient.get("/users/").then((res) => res.data);
}

export function getUser(userId) {
  return apiClient.get(`/users/${userId}`).then((res) => res.data);
}

export function createUser({ profile_photo, ...fields }) {
  return apiClient
    .post(`/users/?${buildQuery(fields)}`, profile_photo ?? null)
    .then((res) => res.data);
}

export function updateUser(userId, { profile_photo, ...fields }) {
  const hasPhoto = profile_photo !== undefined;
  return apiClient
    .put(`/users/${userId}?${buildQuery(fields)}`, hasPhoto ? profile_photo : undefined)
    .then((res) => res.data);
}

export function deactivateUser(userId) {
  return updateUser(userId, { is_active: 0 });
}
