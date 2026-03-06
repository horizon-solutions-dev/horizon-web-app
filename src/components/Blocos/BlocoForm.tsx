import { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import "./Bloco.scss";
import {
  Box,
  Button,
  TextField,
  CircularProgress,
  // Alert,
} from "@mui/material";
import { type CondominiumBlock, type CondominiumBlockRequest, blockService } from "../../services/blockService";
import StepWizardCard from "../../shared/components/StepWizardCard";
import { AppStateModal } from "../../shared/components/AppStateModal";
import { useAppStateModal } from "../../shared/utils/useAppStateModal";
import { useTranslation } from "react-i18next";

interface BlocoFormProps {
  open: boolean;
  editingBlock: CondominiumBlock | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  condominiumIdPreset?: string;
}

const BlocoForm: React.FC<BlocoFormProps> = ({
  open,
  editingBlock,
  onClose,
  onSaved,
  loading,
  setLoading,
  condominiumIdPreset,
}) => {
  const { t } = useTranslation();
  const { appStateModal, handleClose, showSuccess, showError } = useAppStateModal();
  const [closeAfterModal, setCloseAfterModal] = useState(false);

  const initialForm: CondominiumBlockRequest = {
    condominiumId: condominiumIdPreset || "",
    code: "",
    name: "",
  };

  const [formData, setFormData] = useState<CondominiumBlockRequest>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const steps = [t("blocoForm.stepData")];

  useEffect(() => {
    if (!open) return;
    setActiveStep(0);
    setErrors({});
    if (editingBlock) {
      setEditingId(editingBlock.condominiumBlockId);
      setFormData({
        condominiumId: editingBlock.condominiumId,
        code: editingBlock.code,
        name: editingBlock.name,
      });
    } else {
      setEditingId(null);
      setFormData({
        condominiumId: condominiumIdPreset || "",
        code: "",
        name: "",
      });
    }
  }, [open, editingBlock, condominiumIdPreset]);

  if (!open) return null;

  const handleChange = (field: keyof CondominiumBlockRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.condominiumId?.trim()) {
      newErrors.condominiumId = t("blocoForm.condominiumIdRequired");
    }

    if (!formData.code?.trim()) {
      newErrors.code = t("blocoForm.codeRequired");
    }

    if (!formData.name?.trim()) {
      newErrors.name = t("blocoForm.nameRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await blockService.updateBlock(editingId, formData);
        showSuccess(t("blocoForm.updateSuccess"));
      } else {
        await blockService.createBlock(formData);
        showSuccess(t("blocoForm.createSuccess"));
      }

      await onSaved();
      setFormData({
        condominiumId: condominiumIdPreset || "",
        code: "",
        name: "",
      });
      setEditingId(null);
      setActiveStep(0);
      setErrors({});
      setCloseAfterModal(true);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 422) {
        setErrors({ code: t("blocoForm.duplicateCode") });
      } else {
        const message = error instanceof Error ? error.message : t("blocoForm.saveError");
        showError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    handleClose();
    onSaved();
    if (closeAfterModal) {
      setCloseAfterModal(false);
      onClose();
    }
  };

  const renderStepContent = () => {
    if (activeStep === 0) {
      return (
        <>
          <Box className="bloco-form" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: 46,
                },
              }}
              placeholder={t("blocoForm.codePlaceholder")}
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value)}
              error={!!errors.code}
              helperText={errors.code}
              fullWidth
              required
              variant="outlined"

            />
            <TextField
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: 46,
                },
              }}
              placeholder={t("blocoForm.namePlaceholder")}
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
              required
              variant="outlined"

            />
          </Box>

        </>
      );
    }

    return null;
  };


  const renderActions = () => {
    return (
      <Button variant="contained" onClick={handleSubmit} disabled={loading}>
        {loading ? <CircularProgress size={20} /> : t("common.finish")}
      </Button>
    );
  };

  return (
    <Box className="bloco-container">
      <StepWizardCard
        title={editingId ? t("blocoForm.editTitle") : t("blocoForm.createTitle")}
        subtitle={steps[activeStep]}
        subtitleClassName="bloco-form-subtitle"
        steps={steps}
        activeStep={activeStep}
        showBack={false}
        onClose={onClose}
        disableContent={loading}
        actions={renderActions()}
      >
        {renderStepContent()}
      </StepWizardCard>

      <AppStateModal
        open={appStateModal.open}
        type={appStateModal.type}
        title={appStateModal.title}
        message={appStateModal.message}
        detail={appStateModal.detail}
        onConfirm={handleModalClose}
        onClose={handleModalClose}
        showCancel={false}
      />
    </Box>
  );
};

export default BlocoForm;
