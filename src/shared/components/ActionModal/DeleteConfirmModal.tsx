import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  IconButton,
  Typography,
} from "@mui/material";
import { Close, DeleteForeverOutlined, WarningAmberRounded } from "@mui/icons-material";
import "./DeleteConfirmModal.scss";

export interface DeleteConfirmModalProps {
  open: boolean;
  title?: string;
  message?: string;
  detail?: string;
  entityLabel?: string;
  imageAlt?: string;
  imageSlot?: React.ReactNode;
  imageSrc?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  showClose?: boolean;
  closeOnConfirm?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  onClose?: () => void;
}

export default function DeleteConfirmModal({
  open,
  title,
  message,
  detail,
  entityLabel = "este item",
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
  showClose = true,
  closeOnConfirm = true,
  onConfirm,
  onCancel,
  onClose,
}: DeleteConfirmModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const resolvedTitle = useMemo(
    () => title || `Excluir ${entityLabel}?`,
    [title, entityLabel],
  );
  const resolvedMessage = useMemo(
    () => message || "Essa ação é permanente e não poderá ser desfeita.",
    [message],
  );

  const handleClose = () => {
    if (submitting) return;
    onClose?.();
  };

  const handleCancel = () => {
    if (submitting) return;
    onCancel();
  };

  const handleConfirm = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      await onConfirm();
      if (closeOnConfirm) {
        onClose?.();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      classes={{ paper: "delete-modal-paper" }}
    >
      <Box className="delete-modal">
        {showClose ? (
          <IconButton
            className="delete-modal__close"
            onClick={handleClose}
            size="small"
            aria-label="Fechar modal"
            disabled={submitting}
          >
            <Close />
          </IconButton>
        ) : null}

        <Box className="delete-modal__badge-wrap">
          <Box className="delete-modal__badge">
            <DeleteForeverOutlined />
          </Box>
          <WarningAmberRounded className="delete-modal__warn" />
        </Box>

        <Typography className="delete-modal__title">{resolvedTitle}</Typography>
        <Typography className="delete-modal__message">{resolvedMessage}</Typography>
        {detail ? <Typography className="delete-modal__detail">{detail}</Typography> : null}

        <Box className="delete-modal__actions">
          <Button
            variant="outlined"
            className="delete-modal__btn delete-modal__btn--cancel"
            onClick={handleCancel}
            disabled={submitting}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="contained"
            className="delete-modal__btn delete-modal__btn--confirm"
            onClick={handleConfirm}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {submitting ? "Excluindo..." : confirmLabel}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
