import React from "react";
import ActionModal from "./ActionModal";

interface WarningErrorModalProps {
  open: boolean;
  title?: string;
  message?: string;
  detail?: string;
  imageSrc?: string;
  imageAlt?: string;
  imageSlot?: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose?: () => void;
}

export default function WarningErrorModal({
  open,
  title = "Atencao",
  message = "Ocorreu um erro ao processar a solicitacao.",
  detail,
  imageSrc,
  imageAlt,
  imageSlot,
  confirmLabel = "Ok",
  onConfirm,
  onClose,
}: WarningErrorModalProps) {
  return (
    <ActionModal
      open={open}
      variant="warning"
      title={title}
      message={message}
      detail={detail}
      imageSrc={imageSrc}
      imageAlt={imageAlt}
      imageSlot={imageSlot}
      confirmLabel={confirmLabel}
      primaryTone="primary"
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
