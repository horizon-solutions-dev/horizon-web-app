import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import {
  unitService,
  type CondominiumUnit,
  type CondominiumUnitRequest,
  type UnitTypeEnum,
} from "../../services/unitService";
import StepWizardCard from "../../shared/components/StepWizardCard";

interface UnidadeFormProps {
  open: boolean;
  editingUnit: CondominiumUnit | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  onNotify: (
    message: string,
    severity?: "success" | "error" | "info" | "warning",
  ) => void;
  unitTypes: UnitTypeEnum[];
  typesLoading: boolean;
  typesError: string | null;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  condominiumIdPreset?: string;
}

const UnidadeForm: React.FC<UnidadeFormProps> = ({
  open,
  editingUnit,
  onClose,
  onSaved,
  onNotify,
  unitTypes,
  typesLoading,
  typesError,
  loading,
  setLoading,
  condominiumIdPreset,
}) => {
  const initialForm: CondominiumUnitRequest = {
    condominiumId: condominiumIdPreset || "",
    condominiumBlockId: "",
    unitCode: "",
    unitType: "Owner",
  };

  const [formData, setFormData] = useState<CondominiumUnitRequest>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const steps = ["Dados da unidade", "Revisao"];

  useEffect(() => {
    if (!open) return;
    setActiveStep(0);
    if (editingUnit) {
      setEditingId(editingUnit.condominiumUnitId);
      setFormData({
        condominiumId: editingUnit.condominiumId,
        condominiumBlockId: editingUnit.condominiumBlockId,
        unitCode: editingUnit.unitCode,
        unitType: editingUnit.unitType || "Owner",
      });
    } else {
      setEditingId(null);
      setFormData({
        condominiumId: condominiumIdPreset || "",
        condominiumBlockId: "",
        unitCode: "",
        unitType: "Owner",
      });
    }
  }, [open, editingUnit, condominiumIdPreset]);

  if (!open) return null;

  const handleChange = (field: keyof CondominiumUnitRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.condominiumId || !formData.condominiumBlockId || !formData.unitCode) {
      onNotify("Preencha CondominiumId, CondominiumBlockId e Codigo da unidade.", "error");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await unitService.updateUnit(editingId, formData);
        onNotify("Unidade atualizada com sucesso.", "success");
      } else {
        await unitService.createUnit(formData);
        onNotify("Unidade criada com sucesso.", "success");
      }

      await onSaved();
      setFormData({
        condominiumId: condominiumIdPreset || "",
        condominiumBlockId: "",
        unitCode: "",
        unitType: "Owner",
      });
      setEditingId(null);
      setActiveStep(0);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar unidade.";
      onNotify(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const renderUnitTypeOptions = () => {
    if (typesLoading) {
      return (
        <MenuItem value={formData.unitType} disabled>
          Carregando...
        </MenuItem>
      );
    }

    if (unitTypes.length > 0) {
      return unitTypes.map((type) => (
        <MenuItem key={type.id} value={type.value}>
          {type.description || type.value}
        </MenuItem>
      ));
    }

    return (
      <>
        <MenuItem value="Owner">Proprietario</MenuItem>
        <MenuItem value="Tenant">Inquilino</MenuItem>
      </>
    );
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
            label="CondominiumBlockId"
            value={formData.condominiumBlockId}
            onChange={(e) => handleChange("condominiumBlockId", e.target.value)}
            fullWidth
          />
          <TextField
            label="Codigo da Unidade"
            value={formData.unitCode}
            onChange={(e) => handleChange("unitCode", e.target.value)}
            fullWidth
          />
          <TextField
            label="Tipo da Unidade"
            select
            value={formData.unitType || ""}
            onChange={(e) => handleChange("unitType", e.target.value)}
            fullWidth
          >
            {renderUnitTypeOptions()}
          </TextField>
          {typesError ? (
            <Typography variant="caption" color="error">
              {typesError}
            </Typography>
          ) : null}
        </Box>
      );
    }

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="subtitle2">CondominiumId: {formData.condominiumId || "-"}</Typography>
        <Typography variant="subtitle2">
          CondominiumBlockId: {formData.condominiumBlockId || "-"}
        </Typography>
        <Typography variant="subtitle2">Codigo: {formData.unitCode || "-"}</Typography>
        <Typography variant="subtitle2">Tipo: {formData.unitType || "-"}</Typography>
      </Box>
    );
  };

  return (
    <StepWizardCard
      title={editingId ? "Editar unidade" : "Criar unidade"}
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

export default UnidadeForm;
