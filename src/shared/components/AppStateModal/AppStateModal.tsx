import { type ReactNode } from "react";
import {
  Dialog,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import {
  CheckCircle,
  DeleteOutline,
  Info,
  ErrorOutline,
  Close,
} from "@mui/icons-material";

export type AppStateModalType =
  | "success"
  | "delete"
  | "session-expired"
  | "error";

export interface AppStateModalProps {
  open: boolean;
  type: AppStateModalType;
  title: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  showClose?: boolean;
  isLoading?: boolean;
  customIcon?: ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
}

const getModalConfig = (type: AppStateModalType) => {
  const configs: Record<
    AppStateModalType,
    {
      icon: ReactNode;
      color: string;
      bgColor: string;
      accentColor: string;
      defaultConfirmLabel: string;
    }
  > = {
    success: {
      icon: <CheckCircle />,
      color: "#2e7d32",
      bgColor: "#e8f5e9",
      accentColor: "#4caf50",
      defaultConfirmLabel: "OK",
    },
    delete: {
      icon: <DeleteOutline />,
      color: "#d32f2f",
      bgColor: "#ffebee",
      accentColor: "#f44336",
      defaultConfirmLabel: "Delete",
    },
    "session-expired": {
      icon: <Info />,
      color: "#f57c00",
      bgColor: "#fff3e0",
      accentColor: "#ff9800",
      defaultConfirmLabel: "Login",
    },
    error: {
      icon: <ErrorOutline />,
      color: "#d32f2f",
      bgColor: "#ffebee",
      accentColor: "#f44336",
      defaultConfirmLabel: "Tentar Novamente",
    },
  };

  return configs[type];
};

export default function AppStateModal({
  open,
  type,
  title,
  message,
  detail,
  confirmLabel,
  cancelLabel = "Cancelar",
  showCancel = true,
  showClose = true,
  isLoading = false,
  customIcon,
  onConfirm,
  onCancel,
  onClose,
}: AppStateModalProps) {
  const config = getModalConfig(type);
  const finalConfirmLabel = confirmLabel || config.defaultConfirmLabel;

  const handleConfirm = async () => {
    await onConfirm();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose?.();
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.15)`,
          border: `.5px solid ${config.color}`,
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          textAlign: "center",
          pt: 4,
          pb: 3,
          px: 3,
          //   background: `linear-gradient(135deg, ${config.bgColor} 0%, white 100%)`,
        }}
      >
        {showClose && (
          <IconButton
            onClick={handleClose}
            disabled={isLoading}
            sx={{
              position: "absolute",
              right: 12,
              top: 12,
              color: "text.secondary",
              "&:hover": {
                color: "error.main",
              },
            }}
          >
            <Close />
          </IconButton>
        )}

        {/* Icon */}
        <Box
          sx={{
            fontSize: "64px",
            color: config.color,
            mb: 2,
            display: "flex",
            justifyContent: "center",
            "& svg": {
              fontSize: "64px",
              animation:
                type === "success"
                  ? "scaleIn 0.5s ease-out"
                  : "slideUp 0.5s ease-out",
            },
            "@keyframes scaleIn": {
              "0%": {
                transform: "scale(0)",
                opacity: 0,
              },
              "100%": {
                transform: "scale(1)",
                opacity: 1,
              },
            },
            "@keyframes slideUp": {
              "0%": {
                transform: "translateY(20px)",
                opacity: 0,
              },
              "100%": {
                transform: "translateY(0)",
                opacity: 1,
              },
            },
          }}
        >
          {customIcon || config.icon}
        </Box>

        {/* Title */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: "text.primary",
            mb: 1,
          }}
        >
          {title}
        </Typography>

        {/* Message */}
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            mb: detail ? 1 : 0,
            lineHeight: 1.6,
          }}
        >
          {message}
        </Typography>

        {/* Detail */}
        {detail &&
          (type === "delete" ? (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Box sx={{ height: 1, backgroundColor: "divider", mb: 1.2 }} />
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "text.primary",
                  lineHeight: 1.5,
                }}
              >
                {detail}
              </Typography>
              <Box sx={{ height: 1, backgroundColor: "divider", mt: 1.2 }} />
            </Box>
          ) : (
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                display: "block",
                mt: 1,
                fontStyle: "italic",
              }}
            >
              {detail}
            </Typography>
          ))}
      </Box>

      {/* Actions */}
      <DialogActions
        sx={{
          pt: 2,
          pb: 2,
          px: 3,
          gap: 1,
          flexDirection: showCancel ? "row" : "column",
          "& button": {
            textTransform: "none",
            fontSize: "14px",
            fontWeight: 500,
          },
        }}
      >
        {showCancel && (
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={isLoading}
            sx={{
              flex: showCancel ? 1 : undefined,
              backgroundColor: "#F1F3F5",
              color: "#495057",
              borderColor: "#DEE2E6",
              "&:hover": {
                backgroundColor: "#E9ECEF",
              },
              padding: "14px 40px !important",
              minWidth: " 140px !important",
              fontSize: "14px !important",
              fontWeight: "600 !important",
              borderRadius: "12px !important",
              height: "auto !important",
              lineHeight: "normal !important",
              "&:disabled": {
                backgroundColor: config.accentColor,
                opacity: 0.7,
              },
            }}
          >
            {cancelLabel}
          </Button>
        )}

        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={isLoading}
          loading={isLoading}
          sx={{
            flex: showCancel ? 1 : undefined,

            backgroundColor: config.accentColor,
            padding: "14px 40px !important",
            minWidth: " 140px !important",
            fontSize: "14px !important",
            fontWeight: "600 !important",
            borderRadius: "12px !important",
            height: "auto !important",
            lineHeight: "normal !important",
            color: "white",
            "&:hover": {
              backgroundColor: config.color,
              boxShadow: `0 4px 12px ${config.color}40`,
            },
            "&:disabled": {
              backgroundColor: config.accentColor,
              opacity: 0.7,
            },
          }}
        >
          {finalConfirmLabel}
        </Button>
      </DialogActions>

      <style>{`
        @keyframes scaleIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slideUp {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </Dialog>
  );
}
