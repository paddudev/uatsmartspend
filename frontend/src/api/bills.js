import apiClient from "./client";

export function uploadBill({ file_data, file_type, userid_fk }) {
  return apiClient.post("/bills/upload", { file_data, file_type, userid_fk }).then((res) => res.data);
}

export function listBills(userid_fk) {
  return apiClient.get(`/bills/?userid_fk=${userid_fk}`).then((res) => res.data);
}

export function getBill(id) {
  return apiClient.get(`/bills/${id}`).then((res) => res.data);
}
