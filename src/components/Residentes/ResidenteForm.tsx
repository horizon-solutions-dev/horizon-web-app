import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import {
  unitResidentService,
  type CondominiumUnitResidentRequest,
} from "../../services/unitResidentService";
import StepWizardCard from "../../shared/components/StepWizardCard";
import { AuthService } from "../../services/authService";
import { TokenService } from "../../services/tokenService";

interface ResidenteFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  onNotify: (
    message: string,
    severity?: "success" | "error" | "info" | "warning",
  ) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  unitIdPreset?: string;
}


const ResidenteForm: React.FC<ResidenteFormProps> = ({
  open,
  onClose,
  onSaved,
  onNotify,
  loading,
  setLoading,
  unitIdPreset,
}) => {
  const initialForm: CondominiumUnitResidentRequest = {
    condominiumUnitId: unitIdPreset || "",
    userId: "",
    unitType: "Owner",
    startDate: "",
    endDate: "",
    billingContact: false,
    canVote: false,
    canMakeReservations: false,
    hasGatehouseAccess: false,
  };

  const [formData, setFormData] = useState<CondominiumUnitResidentRequest>(
    initialForm,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeStep, setActiveStep] = useState(0);
  const [validatingStep, setValidatingStep] = useState(false);
  const steps = ["Dados do residente", "Periodo", "Permissoes"];

const tokenUserId = useMemo(() => {
    const token = AuthService.getToken();
    return TokenService.getUserId(token) || '';
  }, []);    
  useEffect(() => {
    if (!open) return;
    setActiveStep(0);
    setFormData({
      condominiumUnitId: unitIdPreset || "",
      userId: tokenUserId,
      unitType: "Owner",
      startDate: "",
      endDate: "",
      billingContact: false,
      canVote: false,
      canMakeReservations: false,
      hasGatehouseAccess: false,
    });
    setErrors({});
  }, [open, unitIdPreset]);

  if (!open) return null;

  const handleChange = (
    field: keyof CondominiumUnitResidentRequest,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateStep = (step: number) => {
    const nextErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.condominiumUnitId) {
        nextErrors.condominiumUnitId = "CondominiumUnitId é obrigatório.";
      }
      if (!formData.userId) {
        nextErrors.userId = "UserId é obrigatório.";
      }
      if (!formData.unitType) {
        nextErrors.unitType = "Tipo da unidade é obrigatório.";
      }
    }

    if (step === 1) {
      if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate).getTime();
        const end = new Date(formData.endDate).getTime();
        if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
          nextErrors.endDate = "Fim deve ser maior que o início.";
        }
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(activeStep)) return;
    setValidatingStep(true);
    unitResidentService
      .createResident({
        ...formData,
        startDate: new Date().toISOString().substring(0, 10),
        endDate: new Date().toISOString().substring(0, 10),
        commit: false,
      })
      .then(() => {
        setActiveStep((prev) => prev + 1);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Erro ao validar residente.";
        onNotify(message, "error");
      })
      .finally(() => {
        setValidatingStep(false);
      });
  };

  const handleSubmit = async () => {
    if (!validateStep(0) || !validateStep(1)) {
      onNotify("Revise os campos obrigatórios.", "error");
      return;
    }

    setLoading(true);
    try {
      await unitResidentService.createResident({
        ...formData,
        commit: true,
      });
      onNotify("Residente criado com sucesso.", "success");
      await onSaved();
      setFormData({
        condominiumUnitId: unitIdPreset || "",
        userId: "",
        unitType: "Owner",
        startDate: new Date().toISOString().slice(0, 16),
        endDate: "",
        billingContact: false,
        canVote: false,
        canMakeReservations: false,
        hasGatehouseAccess: false,
      });
      setActiveStep(0);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar residente.";
      onNotify(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepWizardCard
      title="Criar residente"
      subtitle={steps[activeStep]}
      steps={steps}
      activeStep={activeStep}
      showBack={activeStep > 0 && activeStep < steps.length}
      onBack={() => setActiveStep((prev) => prev - 1)}
      onClose={onClose}
    >
      {activeStep === 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Tipo da Unidade"
            select
            value={formData.unitType || ""}
            onChange={(e) => handleChange("unitType", e.target.value)}
            error={Boolean(errors.unitType)}
            helperText={errors.unitType}
            fullWidth
          >
            <MenuItem value="Owner">Proprietario</MenuItem>
            <MenuItem value="Tenant">Inquilino</MenuItem>
          </TextField>
        </Box>
      ) : null}

      {activeStep === 1 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Inicio"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            value={formData.startDate || ""}
            onChange={(e) => handleChange("startDate", e.target.value)}
            fullWidth
          />
          <TextField
            label="Fim"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            value={formData.endDate || ""}
            onChange={(e) => handleChange("endDate", e.target.value)}
            error={Boolean(errors.endDate)}
            helperText={errors.endDate}
            fullWidth
          />
        </Box>
      ) : null}

      {activeStep === 2 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(formData.billingContact)}
                  onChange={(e) => handleChange("billingContact", e.target.checked)}
                />
              }
              label="Contato de cobranca"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(formData.canVote)}
                  onChange={(e) => handleChange("canVote", e.target.checked)}
                />
              }
              label="Pode votar"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(formData.canMakeReservations)}
                  onChange={(e) => handleChange("canMakeReservations", e.target.checked)}
                />
              }
              label="Pode reservar"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(formData.hasGatehouseAccess)}
                  onChange={(e) => handleChange("hasGatehouseAccess", e.target.checked)}
                />
              }
              label="Acesso portaria"
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="subtitle2">
              Unidade: {formData.condominiumUnitId || "-"}
            </Typography>
            <Typography variant="subtitle2">Usuario: {formData.userId || "-"}</Typography>
            <Typography variant="subtitle2">Tipo: {formData.unitType || "-"}</Typography>
            <Typography variant="subtitle2">Inicio: {formData.startDate || "-"}</Typography>
            <Typography variant="subtitle2">Fim: {formData.endDate || "-"}</Typography>
          </Box>
        </Box>
      ) : null}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 3 }}>
        {activeStep === steps.length - 1 ? (
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Criar residente"}
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNext} disabled={validatingStep}>
            {validatingStep ? <CircularProgress size={20} /> : "Proximo"}
          </Button>
        )}
      </Box>
    </StepWizardCard>
  );
};

export default ResidenteForm;
