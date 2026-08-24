import apiClient from "./client";

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

export function createUser({ username, email, full_name, hashed_password, is_active }) {
  return apiClient
    .post("/users/", null, {
      params: { username, email, full_name, hashed_password, is_active },
    })
    .then((res) => res.data);
}

export function updateUser(userId, fields) {
  return apiClient
    .put(`/users/${userId}`, null, { params: fields })
    .then((res) => res.data);
}

export function deactivateUser(userId) {
  return updateUser(userId, { is_active: 0 });
}
