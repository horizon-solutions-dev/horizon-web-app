import type { SxProps, Theme } from "@mui/material/styles";

export const desabilitarCampos: SxProps<Theme> = {
  "& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline": {
    borderColor: "#e0e0e0 !important",
  },
  "& .MuiOutlinedInput-root.Mui-disabled:hover .MuiOutlinedInput-notchedOutline":
    {
      borderColor: "#e0e0e0 !important",
    },
  "& .MuiOutlinedInput-root.Mui-disabled.Mui-focused .MuiOutlinedInput-notchedOutline":
    {
      borderColor: "#e0e0e0 !important",
    },
  "& .MuiOutlinedInput-root.Mui-disabled": {
    backgroundColor: "#f8f9fa !important",
  },
  "& .MuiOutlinedInput-root.Mui-disabled input": {
    WebkitTextFillColor: "#6b7280 !important",
  },
  "& .MuiOutlinedInput-root.Mui-disabled textarea": {
    WebkitTextFillColor: "#6b7280 !important",
  },
  "& .MuiInputLabel-root.Mui-disabled": {
    color: "#6b7280 !important",
  },
  "& .MuiFormHelperText-root.Mui-disabled": {
    color: "#6b7280 !important",
  },
};
