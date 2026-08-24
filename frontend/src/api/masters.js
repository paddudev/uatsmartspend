import apiClient from "./client";

function buildQuery(fields) {
  const params = new URLSearchParams();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    params.append(key, value);
  });
  return params.toString();
}

// Common master
export function listCommonMasters() {
  return apiClient.get("/commonmaster/").then((res) => res.data);
}
export function getCommonMaster(id) {
  return apiClient.get(`/commonmaster/${id}`).then((res) => res.data);
}
export function createCommonMaster(fields) {
  return apiClient.post(`/commonmaster/?${buildQuery(fields)}`).then((res) => res.data);
}
export function updateCommonMaster(id, fields) {
  return apiClient.put(`/commonmaster/${id}?${buildQuery(fields)}`).then((res) => res.data);
}
export function deleteCommonMaster(id) {
  return apiClient.delete(`/commonmaster/${id}`).then((res) => res.data);
}

// Category master
export function listCategoryMasters() {
  return apiClient.get("/categorymaster/").then((res) => res.data);
}
export function getCategoryMaster(id) {
  return apiClient.get(`/categorymaster/${id}`).then((res) => res.data);
}
export function createCategoryMaster(fields) {
  return apiClient.post(`/categorymaster/?${buildQuery(fields)}`).then((res) => res.data);
}
export function updateCategoryMaster(id, fields) {
  return apiClient.put(`/categorymaster/${id}?${buildQuery(fields)}`).then((res) => res.data);
}
export function deleteCategoryMaster(id) {
  return apiClient.delete(`/categorymaster/${id}`).then((res) => res.data);
}

// Products and services
export function listProductsAndServices() {
  return apiClient.get("/productsandservices/").then((res) => res.data);
}
export function getProductsAndServices(id) {
  return apiClient.get(`/productsandservices/${id}`).then((res) => res.data);
}
export function createProductsAndServices(fields) {
  return apiClient.post(`/productsandservices/?${buildQuery(fields)}`).then((res) => res.data);
}
export function updateProductsAndServices(id, fields) {
  return apiClient.put(`/productsandservices/${id}?${buildQuery(fields)}`).then((res) => res.data);
}
export function deleteProductsAndServices(id) {
  return apiClient.delete(`/productsandservices/${id}`).then((res) => res.data);
}
