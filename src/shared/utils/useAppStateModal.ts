import { useState, useCallback } from "react";
import type { AppStateModalType } from "../components/AppStateModal";

interface ModalState {
  open: boolean;
  type: AppStateModalType;
  title: string;
  message: string;
  detail?: string;
  showCancel?: boolean;
  item?: string;
}

/**
 * Hook customizado para usar AppStateModal de forma simplificada
 * Padroniza feedback visual com AppStateModal
 *
 * @example
 * const { appStateModal, showSuccess, showError } = useAppStateModal();
 *
 * const handleSave = async () => {
 *   try {
 *     await api.save(data);
 *     showSuccess("Salvo com sucesso!");
 *   } catch (error) {
 *     showError("Erro ao salvar", error.message);
 *   }
 * };
 */
export const useAppStateModal = () => {
  const [state, setState] = useState<ModalState>({
    open: false,
    type: "success",
    title: "",
    message: "",
    detail: "",
    showCancel: false,
  });

  const handleClose = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const showSuccess = useCallback((message: string, detail?: string) => {
    setState({
      open: true,
      type: "success",
      title: "Ação concluída com sucesso!",
      message,
      detail,
      item: "",
      showCancel: false,
    });
  }, []);

  const showError = useCallback((message: string, detail?: string) => {
    setState({
      open: true,
      type: "error",
      title: "Ocorreu um erro.",
      message,
      detail,
      item: "",
      showCancel: false,
    });
  }, []);

  const showDelete = useCallback(
    (message: string, item?: string, showCancel?: boolean, detail?: string) => {
    setState({
      open: true,
      type: "delete",
      title: "Deletar?",
      message,
      item: item ?? "",
      showCancel: showCancel ?? true,
      detail:
        detail ||
        "O item sairá da lista, mas suas informações continuarão registradas no sistema.",
    });
  }, []);

  const showSessionExpired = useCallback(() => {
    setState({
      open: true,
      type: "session-expired",
      title: "Sua sessao expirou.",
      message: "Por favor, faca login novamente para continuar usando o sistema.",
      detail: "Sua sessao expirou por inatividade.",
      item: "",
      showCancel: false,
    });
  }, []);

  return {
    appStateModal: {
      open: state.open,
      type: state.type,
      title: state.title,
      message: state.message,
      detail: state.detail,
      item: state.item,
      showCancel: state.showCancel,
    },
    handleClose,
    showSuccess,
    showError,
    showDelete,
    showSessionExpired,
  };
};
