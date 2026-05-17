import React, { useRef } from "react";
import { Box, Button, Typography, type SxProps, type Theme } from "@mui/material";
import {
  CameraAlt,
  DeleteOutline,
  EditOutlined,
} from "@mui/icons-material";

interface ImageUploadFieldProps {
  label: string;
  icon?: React.ReactNode;
  showIcon?: boolean;
  description?: string;
  previewUrl?: string | null;
  fileName?: string | null;
  accept?: string;
  height?: number;
  changeLabel?: string;
  removeLabel?: string;
  emptyLabel?: string;
  showTitle?: boolean;
  disabled?: boolean;
  sx?: SxProps<Theme>;
  onChange: (file: File | null) => void;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  icon,
  showIcon = false,
  description,
  previewUrl,
  accept = "image/*",
  height = 140,
  changeLabel,
  removeLabel = "Remover",
  emptyLabel = "Selecionar imagem",
  showTitle = true,
  disabled = false,
  sx,
  onChange,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hasPreview = Boolean(previewUrl);
  const buttonText = changeLabel || (hasPreview ? "Trocar" : emptyLabel);

  const openFilePicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onChange(file);
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;

    const file = event.dataTransfer.files?.[0];
    if (file) onChange(file);
  };

  return (
    <Box
      sx={{
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        p: 2,
        minWidth: 0,
        backgroundColor: "#fff",
        ...sx,
      }}
    >
      {showTitle ? (
        <Box sx={{ display: "flex", gap: 1.5, mb: 2, alignItems: "center" }}>
          {showIcon ? (
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "10px",
                backgroundColor: "#edf4ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                "& .MuiSvgIcon-root": { fontSize: 20 },
              }}
            >
              {icon || <CameraAlt sx={{ fontSize: 20 }} />}
            </Box>
          ) : null}
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1f2a44" }}>
              {label}
            </Typography>
          </Box>
        </Box>
      ) : null}

      <Box
        role="button"
        tabIndex={disabled ? -1 : 0}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        onClick={openFilePicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFilePicker();
          }
        }}
        sx={{
          width: "100%",
          height,
          borderRadius: "10px",
          border: "1.5px dashed #93c5fd",
          backgroundColor: disabled ? "#f1f5f9" : "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          color: "#64748b",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "border-color 0.2s ease, background-color 0.2s ease",
          "&:hover": disabled
            ? undefined
            : {
                borderColor: "#2563eb",
                backgroundColor: "#f8fbff",
              },
        }}
      >
        {previewUrl ? (
          <Box
            component="img"
            src={previewUrl}
            alt={label}
            sx={{
              width: "254px",
              height: "132px",
              objectFit: "contain",
              backgroundColor: "#f8fafc",
            }}
          />
        ) : (
          <Box sx={{ textAlign: "center", px: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                mx: "auto",
                mb: 1.5,
                backgroundColor: "#edf4ff",
                color: "#0b74de",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CameraAlt sx={{ fontSize: 26 }} />
            </Box>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#273b60" }}>
              Clique ou arraste para adicionar
            </Typography>
          </Box>
        )}
        <input
          ref={inputRef}
          hidden
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
        />
      </Box>

      <Typography sx={{ mt: 0.75, fontSize: 11, color: "#667085" }}>
        {description || "JPG ou PNG ate 5MB"}
      </Typography>

{/*       {fileName ? (
        <Typography
          title={fileName}
          sx={{
            mt: 0.25,
            fontSize: 11,
            color: "#667085",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {fileName}
        </Typography>
      ) : null} */}

      {hasPreview ? (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
          <Button
            variant="outlined"
            className="action-button-edit"
            size="small"
            disabled={disabled}
            startIcon={<EditOutlined />}
            onClick={openFilePicker}
            sx={{ textTransform: "none", height: "32px !important" }}
          >
            {buttonText}
          </Button>
          <Button
            className="action-button-delete"
            variant="outlined"
            color="error"
            size="small"
            disabled={disabled}
            startIcon={<DeleteOutline />}
            onClick={() => onChange(null)}
            sx={{ textTransform: "none", height: "32px !important" }}
          >
            {removeLabel === "Remover" ? "Excluir" : removeLabel}
          </Button>
        </Box>
      ) : null}


    </Box>
  );
};

export default ImageUploadField;
