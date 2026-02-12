import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
//  Typography,
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
  condominiumNamePreset?: string;
  blockId: string;
  blockNamePreset?: string;
}

type FormErrors = {
  unitCode?: string;
  unitType?: string;
  allocationType?: string;
};

const ALLOCATION_OPTIONS = [
  { value: "FractionalAllocation", label: "Fracionado" },
  { value: "FixedAllocation", label: "Fixo" },
  { value: "ProportionalAllocation", label: "Proporcional" },
];

const normalizeUnitType = (value?: string | number) => {
  if (value === 1 || value === "1") return "Owner";
  if (value === 2 || value === "2") return "Tenant";
  return value || "Owner";
};

const normalizeAllocationType = (value?: string | number) => {
  if (value === 1 || value === "1") return "FractionalAllocation";
  if (value === 2 || value === "2") return "FixedAllocation";
  if (value === 3 || value === "3") return "ProportionalAllocation";
  return value || "FractionalAllocation";
};

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
  condominiumNamePreset,
  blockId,
  blockNamePreset,
}) => {
  const [formData, setFormData] = useState<CondominiumUnitRequest>({
    condominiumId: condominiumIdPreset || "",
    condominiumBlockId: blockId,
    unitCode: "",
    unitType: "Owner",
    allocationType: "FractionalAllocation",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const steps = ["Dados da unidade"];

  const resolvedCondominiumName = useMemo(
    () => condominiumNamePreset || "Condomínio selecionado",
    [condominiumNamePreset],
  );
  const resolvedBlockName = useMemo(
    () => blockNamePreset || "Bloco selecionado",
    [blockNamePreset],
  );

  useEffect(() => {
    if (!open) return;
    setErrors({});

    if (editingUnit) {
      setEditingId(editingUnit.condominiumUnitId);
      setFormData({
        condominiumId: editingUnit.condominiumId,
        condominiumBlockId: editingUnit.condominiumBlockId,
        unitCode: editingUnit.unitCode,
        unitType: normalizeUnitType(editingUnit.unitType),
        allocationType: normalizeAllocationType(editingUnit.allocationType),
      });
      return;
    }

    setEditingId(null);
    setFormData({
      condominiumId: condominiumIdPreset || "",
      condominiumBlockId: blockId,
      unitCode: "",
      unitType: "Owner",
      allocationType: "FractionalAllocation",
    });
  }, [open, editingUnit, condominiumIdPreset, blockId]);

  if (!open) return null;

  const handleChange = (field: keyof CondominiumUnitRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!formData.condominiumId) {
      //onNotify("Condomínio inválido. Selecione o condomínio novamente.", "error");
    }
    if (!formData.condominiumBlockId) {
      //onNotify("Bloco inválido. Selecione um bloco para continuar.", "error");
    }
    if (!formData.unitCode.trim()) {
      nextErrors.unitCode = "Informe o código da unidade.";
    }
    if (!formData.unitType) {
      nextErrors.unitType = "Selecione o tipo da unidade.";
    }
    if (!formData.allocationType) {
      nextErrors.allocationType = "Selecione o tipo de alocação.";
    }

    setErrors(nextErrors);
    const hasIdErrors = !formData.condominiumId || !formData.condominiumBlockId;
    return !hasIdErrors && Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      ////onNotify("Preencha os campos obrigatórios.", "error");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await unitService.updateUnit(editingId, formData);
        //onNotify("Unidade atualizada com sucesso.", "success");
      } else {
        await unitService.createUnit(formData);
        //onNotify("Unidade criada com sucesso.", "success");
      }

      await onSaved();
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
        <MenuItem value="Owner">Proprietário</MenuItem>
        <MenuItem value="Tenant">Inquilino</MenuItem>
      </>
    );
  };

  return (
    <StepWizardCard
      title={editingId ? "Editar unidade" : "Criar unidade"}
      subtitle={steps[0]}
      steps={steps}
      activeStep={0}
      showBack={false}
      onClose={onClose}
      actions={
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : editingId ? "Atualizar" : "Criar"}
        </Button>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="Condomínio"
          value={resolvedCondominiumName}
          fullWidth
          disabled
        />
        <TextField
          label="Bloco"
          value={resolvedBlockName}
          fullWidth
          disabled
        />
        <TextField
          label="Código da Unidade"
          value={formData.unitCode}
          onChange={(e) => handleChange("unitCode", e.target.value)}
          fullWidth
          error={Boolean(errors.unitCode)}
          helperText={errors.unitCode}
        />
        <TextField
          label="Tipo da Unidade"
          select
          value={formData.unitType || ""}
          onChange={(e) => handleChange("unitType", e.target.value)}
          fullWidth
          error={Boolean(errors.unitType)}
          helperText={errors.unitType || typesError || ""}
        >
          {renderUnitTypeOptions()}
        </TextField>
        <TextField
          label="Tipo de Alocação"
          select
          value={formData.allocationType || ""}
          onChange={(e) => handleChange("allocationType", e.target.value)}
          fullWidth
          error={Boolean(errors.allocationType)}
          helperText={errors.allocationType}
        >
          {ALLOCATION_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </StepWizardCard>
  );
};

export default UnidadeForm;