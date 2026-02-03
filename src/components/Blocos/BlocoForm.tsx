import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
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
  const steps = ["Dados do bloco", "Revisao"];

  useEffect(() => {
    if (!open) return;
    setActiveStep(0);
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
  };

  const handleSubmit = async () => {
    if (!formData.condominiumId || !formData.code || !formData.name) {
      onNotify("Preencha CondominiumId, Codigo e Nome.", "error");
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="CondominiumId"
            value={formData.condominiumId}
            onChange={(e) => handleChange("condominiumId", e.target.value)}
            fullWidth
          />
          <TextField
            label="Codigo"
            value={formData.code}
            onChange={(e) => handleChange("code", e.target.value)}
            fullWidth
          />
          <TextField
            label="Nome"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            fullWidth
          />
        </Box>
      );
    }

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="subtitle2">CondominiumId: {formData.condominiumId || "-"}</Typography>
        <Typography variant="subtitle2">Codigo: {formData.code || "-"}</Typography>
        <Typography variant="subtitle2">Nome: {formData.name || "-"}</Typography>
      </Box>
    );
  };

  return (
    <StepWizardCard
      title={editingId ? "Editar bloco" : "Criar bloco"}
      subtitle={steps[activeStep]}
      steps={steps}
      activeStep={activeStep}
      showBack={activeStep > 0 && activeStep < steps.length}
      onBack={() => setActiveStep((prev) => prev - 1)}
      onClose={onClose}
    >
      {renderStepContent()}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 3 }}>
        {activeStep === steps.length - 1 ? (
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : editingId ? "Atualizar" : "Criar"}
          </Button>
        ) : (
          <Button variant="contained" onClick={() => setActiveStep((prev) => prev + 1)}>
            Proximo
          </Button>
        )}
      </Box>
    </StepWizardCard>
  );
};

export default BlocoForm;
