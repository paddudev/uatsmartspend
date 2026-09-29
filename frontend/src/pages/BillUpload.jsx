import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { uploadBill } from "../api/bills";
import { useAuth } from "../auth/AuthContext";
import { fileToBase64 } from "../utils/fileToBase64";
import { useNotification } from "../notifications/NotificationContext";

export default function BillUpload() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifySuccess } = useNotification();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setResult(null);
    setError("");
    setPreviewUrl(selected.type.startsWith("image/") ? URL.createObjectURL(selected) : "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Choose a bill image or PDF to upload.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const base64 = await fileToBase64(file);
      const uploadResult = await uploadBill({
        file_data: base64,
        file_type: file.type,
        userid_fk: user.id,
      });
      setResult(uploadResult);
      notifySuccess("Bill uploaded and processed successfully.");
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to process bill.");
    } finally {
      setSubmitting(false);
    }
  }

  const aiCount = result?.transactions.filter((t) => t.source === "ai").length ?? 0;
  const draftCount = result?.transactions.filter((t) => t.source === "draft").length ?? 0;

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Upload bill
      </Typography>

      <Paper sx={{ p: 3, width: "100%", mb: 3 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}

            <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} sx={{ alignSelf: "flex-start" }}>
              Choose bill file
              <input type="file" accept="image/*,application/pdf" hidden onChange={handleFileChange} />
            </Button>

            {file && (
              <Typography variant="body2" color="text.secondary">
                Selected: {file.name}
              </Typography>
            )}

            {previewUrl && (
              <Box
                component="img"
                src={previewUrl}
                alt="Bill preview"
                sx={{ maxWidth: 300, maxHeight: 300, objectFit: "contain", border: 1, borderColor: "divider" }}
              />
            )}

            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" disabled={submitting || !file}>
                {submitting ? "Processing..." : "Upload & classify"}
              </Button>
              <Button onClick={() => navigate("/app/transaction")}>Back to transactions</Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>

      {result && (
        <Paper sx={{ p: 3, width: "100%" }}>
          <Typography variant="h6" gutterBottom>
            Results
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip label={`${aiCount} AI classified`} color="success" size="small" />
            <Chip label={`${draftCount} need review`} color="warning" size="small" />
          </Stack>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Product/Service</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Brand</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.transactions.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell>{t.raw_item_text}</TableCell>
                    <TableCell>{t.amount}</TableCell>
                    <TableCell>{t.product_name || "—"}</TableCell>
                    <TableCell>{t.category_name || "—"}</TableCell>
                    <TableCell>{t.brand_name || "—"}</TableCell>
                    <TableCell>
                      <Chip
                        label={t.source === "ai" ? "AI" : t.product_name ? "Pick category" : "Draft"}
                        color={t.source === "ai" ? "success" : "warning"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {t.source === "draft" && (
                        <Button size="small" onClick={() => navigate(`/app/transaction/${t.id}/edit`)}>
                          Classify
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </>
  );
}
