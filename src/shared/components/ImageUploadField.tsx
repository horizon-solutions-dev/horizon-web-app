import React, { useRef } from "react";
import { Box, Button, Typography, type SxProps, type Theme } from "@mui/material";
import {
  CameraAlt,
  DeleteOutline,
  EditOutlined,
  InfoOutlined,
} from "@mui/icons-material";

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
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "8px",
              backgroundColor: "#edf4ff",
              color: "#0b74de",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <CameraAlt sx={{ fontSize: 20 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1f2a44" }}>
              {label}
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#52627a" }}>
              {description}
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
              width: "100%",
              height: "100%",
              objectFit: "contain",
              backgroundColor: "#f8fafc",
            }}
          />
        ) : (
          <Box sx={{ textAlign: "center", px: 2 }}>
            <Box
              sx={{
                width: 58,
                height: 58,
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
            <Typography sx={{ mt: 0.5, fontSize: 11, color: "#667085" }}>
              JPG ou PNG até 5MB
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

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          mt: 1.5,
          color: "#667085",
        }}
      >
        <InfoOutlined sx={{ fontSize: 15 }} />
        <Typography sx={{ fontSize: 11 }}>
          Formatos aceitos: JPG, PNG&nbsp;&nbsp;•&nbsp;&nbsp;Tamanho máximo: 5MB
        </Typography>
      </Box>
    </Box>
  );
};

export default ImageUploadField;
