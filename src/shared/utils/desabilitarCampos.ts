import type { SxProps, Theme } from "@mui/material/styles";

export const desabilitarCampos: SxProps<Theme> = {
  "& .MuiOutlinedInput-root.Mui-disabled fieldset": {
    borderColor: "#e0e0e0 !important",
  },
  "& .MuiOutlinedInput-root.Mui-disabled:hover fieldset": {
    borderColor: "#e0e0e0 !important",
  },
};
