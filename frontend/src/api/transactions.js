import apiClient from "./client";

function buildQuery(fields) {
  const params = new URLSearchParams();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    params.append(key, value);
  });
  return params.toString();
}

export function listTransactions(filters) {
  const query = filters ? buildQuery(filters) : "";
  return apiClient.get(`/transactions/${query ? `?${query}` : ""}`).then((res) => res.data);
}
export function getTransaction(id) {
  return apiClient.get(`/transactions/${id}`).then((res) => res.data);
}
export function createTransaction(fields) {
  return apiClient.post(`/transactions/?${buildQuery(fields)}`).then((res) => res.data);
}
export function updateTransaction(id, fields) {
  return apiClient.put(`/transactions/${id}?${buildQuery(fields)}`).then((res) => res.data);
}
export function deleteTransaction(id) {
  return apiClient.delete(`/transactions/${id}`).then((res) => res.data);
}
