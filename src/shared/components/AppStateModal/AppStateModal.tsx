import { type ReactNode, useEffect, useState } from "react";
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
  item?: string;
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
      defaultConfirmLabel: "Deletar",
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
  showCancel,
  showClose = true,
  isLoading = false,
  customIcon,
  onConfirm,
  onCancel,
  onClose,
  item,
}: AppStateModalProps) {
  const config = getModalConfig(type);
  const isDelete = type === "delete";
  const shouldShowCancel = type === "error" ? false : (showCancel ?? true);
  const finalConfirmLabel = confirmLabel || config.defaultConfirmLabel;
  const [surfaceCenter, setSurfaceCenter] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setSurfaceCenter(null);
      return;
    }

    const updateSurfaceCenter = () => {
      const candidates = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".step-wizard-card, .MuiDialog-paper:not(.app-state-modal-paper)",
        ),
      ).filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      const surface = candidates[candidates.length - 1];
      if (!surface) {
        setSurfaceCenter(null);
        return;
      }

      const rect = surface.getBoundingClientRect();
      setSurfaceCenter({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    };

    updateSurfaceCenter();
    window.addEventListener("resize", updateSurfaceCenter);
    window.addEventListener("scroll", updateSurfaceCenter, true);

    return () => {
      window.removeEventListener("resize", updateSurfaceCenter);
      window.removeEventListener("scroll", updateSurfaceCenter, true);
    };
  }, [open]);

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
        className: "app-state-modal-paper",
        sx: {
          ...(surfaceCenter
            ? {
                position: "fixed",
                left: surfaceCenter.x,
                top: surfaceCenter.y,
                transform: "translate(-50%, -50%)",
                m: 0,
              }
            : {}),
          borderRadius: isDelete ? "26px" : "12px",
          boxShadow: isDelete
            ? "0 20px 50px rgba(15, 23, 42, 0.25)"
            : "0 8px 32px rgba(0, 0, 0, 0.15)",
          border: isDelete ? "1px solid #e5e7eb" : `.5px solid ${config.color}`,
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          textAlign: "center",
          pt: isDelete ? 3 : 4,
          pb: isDelete ? 2.5 : 3,
          px: isDelete ? 4 : 3,
          //   background: `linear-gradient(135deg, ${config.bgColor} 0%, white 100%)`,
        }}
      >
        {showClose && (
          <IconButton
            onClick={handleClose}
            disabled={isLoading}
            sx={{
              position: "absolute",
              right: 14,
              top: 14,
              color: isDelete ? "#6b7280" : "text.secondary",
              backgroundColor: isDelete ? "#eeeff2" : "transparent",
              width: isDelete ? 40 : "auto",
              height: isDelete ? 40 : "auto",
              "&:hover": {
                color: isDelete ? "#374151" : "error.main",
                backgroundColor: isDelete ? "#e5e7eb" : "transparent",
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
            mb: isDelete ? 1.25 : 2,
            display: "flex",
            justifyContent: "center",
            "& svg": {
              fontSize: isDelete ? "74px" : "64px",
              color: isDelete ? "#ef2b2d" : config.color,
              animation: isDelete
                ? "none"
                : type === "success"
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
            fontWeight: isDelete ? 700 : 600,
            color: "text.primary",
            fontSize: isDelete ? "1.8rem" : undefined,
            mb: 1,
            lineHeight: isDelete ? 1.1 : undefined,
          }}
        >
          {title}
        </Typography>

        {/* Message */}
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            mb: detail ? (isDelete ? 2 : 1) : 0,
            fontSize: isDelete ? "1.05rem" : undefined,
            lineHeight: 1.6,
          }}
        >
          {message}
        </Typography>
        {isDelete && item ? (
          <Typography
            variant="body1"
            sx={{
              color: "text.primary",
              fontWeight: 700,
              fontSize: "1.15rem",
              mb: detail ? 2 : 0,
            }}
          >
            {item}
          </Typography>
        ) : null}

        {/* Detail */}
        {detail &&
          (type === "delete" ? (
            <Box
              sx={{
                mt: 1,
                mb: 2,
                p: 1.5,
                borderRadius: "12px",
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                backgroundColor: "#f6f3e8",
                color: "#5f6368",
                textAlign: "left",
              }}
            >
              <Info sx={{ color: "#1f73d8", fontSize: 22, mt: "2px" }} />
              <Typography
                variant="body2"
                sx={{ fontSize: "0.95rem", lineHeight: 1.4 }}
              >
                {detail}
              </Typography>
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
          pt: isDelete ? 1 : 2,
          pb: isDelete ? 3 : 2,
          px: isDelete ? 4 : 3,
          gap: 1,
          flexDirection: shouldShowCancel ? "row" : "column",
          "& button": {
            textTransform: "none",
            fontSize: "14px",
            fontWeight: 500,
          },
        }}
      >
        {shouldShowCancel && (
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={isLoading}
            sx={{
              flex: shouldShowCancel ? 1 : undefined,
              backgroundColor: isDelete ? "#edeef1" : "#F1F3F5",
              color: isDelete ? "#323841" : "#495057",
              borderColor: isDelete ? "#e3e5ea" : "#DEE2E6",
              "&:hover": {
                backgroundColor: isDelete ? "#e4e6eb" : "#E9ECEF",
              },
              padding: "14px 40px !important",
              minWidth: "140px !important",
              fontSize: "14px !important",
              fontWeight: "700 !important",
              borderRadius: isDelete ? "16px !important" : "12px !important",
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
            flex: shouldShowCancel ? 1 : undefined,
            background: isDelete
              ? "linear-gradient(135deg, #ff2f2f 0%, #ef2626 100%)"
              : config.accentColor,
            padding: "14px 40px !important",
            minWidth: "140px !important",
            fontSize: "14px !important",
            fontWeight: "700 !important",
            borderRadius: isDelete ? "16px !important" : "12px !important",
            height: "auto !important",
            lineHeight: "normal !important",
            color: "white",
            "&:hover": {
              background: isDelete
                ? "linear-gradient(135deg, #f92929 0%, #e91f1f 100%)"
                : config.color,
              boxShadow: isDelete
                ? "0 8px 18px rgba(239, 38, 38, 0.32)"
                : `0 4px 12px ${config.color}40`,
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
