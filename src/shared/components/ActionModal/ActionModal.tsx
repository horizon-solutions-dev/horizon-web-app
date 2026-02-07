import React from "react";
import { Button, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import "./ActionModal.scss";

export type ActionModalVariant = "delete" | "success" | "warning";
export type ActionModalTone = "danger" | "success" | "primary";

interface ActionModalProps {
  open: boolean;
  variant: ActionModalVariant;
  title: string;
  message?: string;
  detail?: string;
  imageSrc?: string;
  imageAlt?: string;
  imageSlot?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  showClose?: boolean;
  primaryTone?: ActionModalTone;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export default function ActionModal({
  open,
  variant,
  title,
  message,
  detail,
  imageSrc,
  imageAlt,
  imageSlot,
  confirmLabel = "Ok",
  cancelLabel = "Cancelar",
  showCancel = false,
  showClose = true,
  primaryTone = "primary",
  onConfirm,
  onCancel,
  onClose,
}: ActionModalProps) {
  if (!open) return null;

  const handleCancel = () => {
    onCancel?.();
    onClose?.();
  };

  const handleConfirm = () => {
    onConfirm?.();
  };

  return (
    <div className="action-modal-overlay">
      <div className={`action-modal action-modal--${variant}`}>
        {showClose ? (
          <IconButton
            className="action-modal__close"
            onClick={onClose}
            size="small"
          >
            <Close />
          </IconButton>
        ) : null}

        <div className="action-modal__image">
          {imageSlot
            ? imageSlot
            : imageSrc
              ? <img src={imageSrc} alt={imageAlt || title} />
              : <span>Imagem</span>}
        </div>

        <div className="action-modal__title">{title}</div>
        {message ? <div className="action-modal__message">{message}</div> : null}
        {detail ? <div className="action-modal__detail">{detail}</div> : null}

        <div className="action-modal__actions">
          {showCancel ? (
            <Button
              variant="outlined"
              className="action-modal__button action-modal__button--ghost"
              onClick={handleCancel}
            >
              {cancelLabel}
            </Button>
          ) : null}
          <Button
            variant="contained"
            className={`action-modal__button action-modal__button--${primaryTone}`}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
