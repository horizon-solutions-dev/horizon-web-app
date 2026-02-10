import React from "react";
import ActionModal from "./ActionModal";

interface SuccessNoticeModalProps {
  open: boolean;
  title?: string;
  message?: string;
  imageSrc?: string;
  imageAlt?: string;
  imageSlot?: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose?: () => void;
}

export default function SuccessNoticeModal({
  open,
  title = "Operacao concluida",
  message = "Os dados foram salvos com sucesso.",
  imageSrc,
  imageAlt,
  imageSlot,
  confirmLabel = "Ok",
  onConfirm,
  onClose,
}: SuccessNoticeModalProps) {
  return (
    <ActionModal
      open={open}
      variant="success"
      title={title}
      message={message}
      imageSrc={imageSrc}
      imageAlt={imageAlt}
      imageSlot={imageSlot}
      confirmLabel={confirmLabel}
      primaryTone="success"
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
