import React from "react";
import { Box, Button, Typography, type SxProps, type Theme } from "@mui/material";
import { CloudUploadOutlined, DeleteOutline, ImageOutlined } from "@mui/icons-material";

interface ImageUploadFieldProps {
  label: string;
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
  description = "Formatos aceitos: JPG, PNG.",
  previewUrl,
  fileName,
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
  const hasPreview = Boolean(previewUrl);
  const buttonText = changeLabel || (hasPreview ? "Trocar" : emptyLabel);

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
        borderRadius: "8px",
        p: 1.5,
        minWidth: 0,
        ...sx,
      }}
    >
      {showTitle ? (
        <Typography sx={{ mb: 1, fontSize: 13, fontWeight: 700, color: "#344054" }}>
          {label}
        </Typography>
      ) : null}

      <Box
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        sx={{
          width: "100%",
          height,
          borderRadius: "8px",
          border: "1.5px dashed #cbd5e1",
          backgroundColor: disabled ? "#f1f5f9" : "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          color: "#64748b",
        }}
      >
        {previewUrl ? (
          <Box
            component="img"
            src={previewUrl}
            alt={label}
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Box sx={{ textAlign: "center", px: 2 }}>
            <ImageOutlined sx={{ fontSize: 38, color: "#2563eb", mb: 0.75 }} />
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#344054" }}>
              {emptyLabel}
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 11, color: "#667085" }}>
              {description}
            </Typography>
          </Box>
        )}
      </Box>

      {fileName ? (
        <Typography
          title={fileName}
          sx={{
            mt: 0.75,
            fontSize: 11,
            color: "#667085",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {fileName}
        </Typography>
      ) : null}

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
        <Button
          variant="contained"
          component="label"
          size="small"
          disabled={disabled}
          startIcon={<CloudUploadOutlined />}
          sx={{ textTransform: "none", height: '32px !important' }}
        >
          {buttonText}
          <input hidden type="file" accept={accept} onChange={handleInputChange} />
        </Button>

        {hasPreview ? (
          <Button
          className="action-button-delete"
            variant="outlined"
            color="error"
            size="small"
            disabled={disabled}
            startIcon={<DeleteOutline />}
            onClick={() => onChange(null)}
            sx={{ textTransform: "none", height: '45px !important' }}
          >
            {removeLabel}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
};

export default ImageUploadField;
