import React from "react";
import ActionModal from "./ActionModal";
import Remove from '../../../assets/remove.png'
interface DeleteConfirmModalProps {
  open: boolean;
  title?: string;
  message?: string;
  imageSrc?: string;
  imageAlt?: string;
  imageSlot?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onClose?: () => void;
}

export default function DeleteConfirmModal({
  open,
  title = "Deseja excluir este item?",
  message = "",
  imageSrc,
  imageAlt,
  imageSlot,
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  onClose,
}: DeleteConfirmModalProps) {
  return (
    <ActionModal
      open={open}
      variant="delete"
      title={title}
      message={message}
      imageSrc={Remove}
      imageAlt={imageAlt}
      imageSlot={imageSlot}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      showCancel
      primaryTone="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
      onClose={onClose}
    />
  );
}
