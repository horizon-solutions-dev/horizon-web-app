import React, { useEffect, useState } from "react";
import "./Bloco.scss";
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
} from "@mui/material";
import { type CondominiumBlock, type CondominiumBlockRequest, blockService } from "../../services/blockService";
import StepWizardCard from "../../shared/components/StepWizardCard";

interface BlocoFormProps {
  open: boolean;
  editingBlock: CondominiumBlock | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  onNotify: (
    message: string,
    severity?: "success" | "error" | "info" | "warning",
  ) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  condominiumIdPreset?: string;
}

const BlocoForm: React.FC<BlocoFormProps> = ({
  open,
  editingBlock,
  onClose,
  onSaved,
  onNotify,
  loading,
  setLoading,
  condominiumIdPreset,
}) => {
  const initialForm: CondominiumBlockRequest = {
    condominiumId: condominiumIdPreset || "",
    code: "",
    name: "",
  };

  const [formData, setFormData] = useState<CondominiumBlockRequest>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const steps = ["Dados do Bloco"];

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
      newErrors.condominiumId = "CondominiumId é obrigatório.";
    }

    if (!formData.code?.trim()) {
      newErrors.code = "Código é obrigatório.";
    }

    if (!formData.name?.trim()) {
      newErrors.name = "Nome é obrigatório.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      onNotify("Por favor, corrija os erros antes de continuar.", "error");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await blockService.updateBlock(editingId, formData);
        onNotify("Bloco atualizado com sucesso.", "success");
      } else {
        await blockService.createBlock(formData);
        onNotify("Bloco criado com sucesso.", "success");
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
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar bloco.";
      onNotify(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    if (activeStep === 0) {
      return (
        <Box className="bloco-form" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            placeholder="Código"
            value={formData.code}
            onChange={(e) => handleChange("code", e.target.value)}
            error={!!errors.code}
            helperText={errors.code}
            fullWidth
            required
            variant="outlined"
            InputLabelProps={{ shrink: false }}
          />
          <TextField
            placeholder="Nome"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            required
            variant="outlined"
            InputLabelProps={{ shrink: false }}
          />
        </Box>
      );
    }

    return null;
  };

  return (
    <Box className="bloco-container">
      <StepWizardCard
        title={editingId ? "Editar Bloco" : "Criar Bloco"}
        subtitle={steps[activeStep]}
        subtitleClassName="bloco-form-subtitle"
        steps={steps}
        activeStep={activeStep}
        showBack={false}
        onClose={onClose}
      >
        {renderStepContent()}
        
        {Object.keys(errors).length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Por favor, corrija os erros acima antes de continuar.
          </Alert>
        )}

        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 3 }}>
          <Button 
            variant="contained" 
            onClick={handleSubmit} 
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : "Concluir"}
          </Button>
        </Box>
      </StepWizardCard>
    </Box>
  );
};

export default BlocoForm;