import { useEffect, useState } from "react";
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { listCategoryMasters, listCommonMasters, listProductsAndServices } from "../api/masters";

export default function TransactionCategoryFields({
  commonMasterId,
  categoryId,
  productId,
  onCommonMasterChange,
  onCategoryChange,
  onProductChange,
}) {
  const [commonMasters, setCommonMasters] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    Promise.all([listCommonMasters(), listCategoryMasters(), listProductsAndServices()]).then(
      ([commons, cats, prods]) => {
        setCommonMasters(commons.filter((c) => c.tag === "transaction type"));
        setCategories(cats);
        setProducts(prods);
      }
    );
  }, []);

  const visibleCategories = categories.filter((c) => c.commonmaster_fk === commonMasterId);
  const visibleProducts = products.filter((p) => p.categorymaster_fk === categoryId);

  function handleCommonMasterChange(value) {
    onCommonMasterChange(Number(value));
    onCategoryChange("");
    onProductChange("");
  }

  function handleCategoryChange(value) {
    onCategoryChange(value);
    onProductChange("");
  }

  return (
    <>
      <FormControl required>
        <FormLabel id="common-master-label">Transaction Type</FormLabel>
        <RadioGroup
          aria-labelledby="common-master-label"
          row
          value={commonMasterId != null ? String(commonMasterId) : ""}
          onChange={(e) => handleCommonMasterChange(e.target.value)}
        >
          {commonMasters.map((c) => (
            <FormControlLabel key={c.id} value={String(c.id)} control={<Radio />} label={c.name} />
          ))}
        </RadioGroup>
      </FormControl>

      <TextField
        select
        label="Category"
        value={categoryId || ""}
        onChange={(e) => handleCategoryChange(e.target.value)}
        required
        fullWidth
        disabled={!commonMasterId}
        helperText={!commonMasterId ? "Select a transaction type first" : ""}
      >
        {visibleCategories.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Product/Service"
        value={productId || ""}
        onChange={(e) => onProductChange(e.target.value)}
        required
        fullWidth
        disabled={!categoryId}
        helperText={!categoryId ? "Select a category first" : ""}
      >
        {visibleProducts.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.name}
          </MenuItem>
        ))}
      </TextField>
    </>
  );
}
