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
import moment from "moment";

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
  condominiumNamePreset?: string;
  blockNamePreset?: string;
  unitCodePreset?: string;
}

const STEPS = ["Periodo", "Permissoes"];

type ValidationItem = { field: string; message: string };

const STEP_FIELDS: Array<Array<keyof CondominiumUnitResidentRequest>> = [
  ["condominiumUnitId", "userId", "unitType", "startDate", "endDate"],
  ["billingContact", "canVote", "canMakeReservations", "hasGatehouseAccess"],
];

const FIELD_MAP: Record<string, keyof CondominiumUnitResidentRequest> = {
  condominiumunitid: "condominiumUnitId",
  userid: "userId",
  unittype: "unitType",
  startdate: "startDate",
  enddate: "endDate",
  billingcontact: "billingContact",
  canvote: "canVote",
  canmakereservations: "canMakeReservations",
  hasgatehouseaccess: "hasGatehouseAccess",
  commit: "commit",
};

const ResidenteForm: React.FC<ResidenteFormProps> = ({
  open,
  onClose,
  onSaved,
  onNotify,
  loading,
  setLoading,
  unitIdPreset,
  condominiumNamePreset,
  blockNamePreset,
  unitCodePreset,
}) => {
  const tokenUserId = useMemo(() => {
    const token = AuthService.getToken();
    return TokenService.getUserId(token) || "";
  }, []);

  const [formData, setFormData] = useState<CondominiumUnitResidentRequest>({
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeStep, setActiveStep] = useState(0);
  const [validatingStep, setValidatingStep] = useState(false);

  const buildResidentPayload = (commit: boolean) => ({
    ...formData,
    //enviar data final igual data inicial.
    endDate: formData.startDate,
    commit,
  });

  useEffect(() => {
    if (!open) return;
    setActiveStep(0);
    setErrors({});
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
  }, [open, unitIdPreset, tokenUserId]);

  if (!open) return null;

  const getUnitTypeLabel = (value?: string | number) => {
    if (!value) return "-";
    if (value === "1" || value === 1 || value === "Owner") return "Proprietario";
    if (value === "2" || value === 2 || value === "Tenant") return "Inquilino";
    return String(value);
  };

  const handleChange = (
    field: keyof CondominiumUnitResidentRequest,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const getLocalStepErrors = (step: number) => {
    const nextErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.condominiumUnitId) {
        nextErrors.condominiumUnitId = "CondominiumUnitId e obrigatorio.";
      }
      if (!formData.userId) {
        nextErrors.userId = "UserId e obrigatorio.";
      }
      if (!formData.unitType) {
        nextErrors.unitType = "Tipo da unidade e obrigatorio.";
      }
    }

    if (step === 0 && !formData.startDate) {
      nextErrors.startDate = "Inicio e obrigatorio.";
    }

    return nextErrors;
  };

  const mapValidationErrors = (
    validations: ValidationItem[],
    allowedFields?: Array<keyof CondominiumUnitResidentRequest>,
  ) => {
    const nextErrors: Record<string, string> = {};

    validations.forEach((validation) => {
      const key = validation.field?.replace(/\s+/g, "").toLowerCase();
      const field = key ? FIELD_MAP[key] : undefined;
      if (!field) return;
      if (allowedFields && !allowedFields.includes(field)) return;
      nextErrors[field] = validation.message;
    });

    return nextErrors;
  };

  const handleNext = async () => {
    const localErrors = getLocalStepErrors(activeStep);
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    setValidatingStep(true);
    try {
      const { valid, validations } = await unitResidentService.validateResident({
        ...buildResidentPayload(false),
      });

      if (!valid && validations.length > 0) {
        const stepErrors = mapValidationErrors(validations, STEP_FIELDS[activeStep]);
        if (Object.keys(stepErrors).length > 0) {
          setErrors(stepErrors);
          return;
        }
      }

      setActiveStep((prev) => prev + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao validar residente.";
      onNotify(message, "error");
    } finally {
      setValidatingStep(false);
    }
  };

  const handleSubmit = async () => {
    const localErrors = {
      ...getLocalStepErrors(0),
    };

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      setActiveStep(0);
      return;
    }

    setLoading(true);
    try {
      const validationResult = await unitResidentService.validateResident({
        ...buildResidentPayload(false),
      });

      if (!validationResult.valid && validationResult.validations.length > 0) {
        const allStepErrors = mapValidationErrors(validationResult.validations);
        if (Object.keys(allStepErrors).length > 0) {
          setErrors(allStepErrors);

          let targetStep = 0;
          (Object.keys(allStepErrors) as Array<keyof CondominiumUnitResidentRequest>).forEach(
            (field) => {
              const stepIndex = STEP_FIELDS.findIndex((fields) => fields.includes(field));
              if (stepIndex >= 0) {
                targetStep = Math.max(targetStep, stepIndex);
              }
            },
          );

          setActiveStep(targetStep);
          return;
        }
      }

      await unitResidentService.createResident({
        ...buildResidentPayload(true),
      });

      await onSaved();
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
      setActiveStep(0);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar residente.";
      onNotify(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    if (step === 0) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Condominio"
            value={condominiumNamePreset || "-"}
            fullWidth
            disabled
            tabIndex={-1}
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Bloco"
            value={blockNamePreset || "-"}
            fullWidth
            disabled
            tabIndex={-1}
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Unidade"
            value={unitCodePreset || "-"}
            fullWidth
            disabled
            tabIndex={-1}
            InputProps={{ readOnly: true }}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              label="Tipo de Residencia"
              select
              value={formData.unitType || ""}
              onChange={(e) => handleChange("unitType", e.target.value)}
              error={Boolean(errors.unitType)}
              helperText={errors.unitType}
              fullWidth
              size="small"
              sx={{
                "& .MuiSelect-select": {
                  fontSize: "14px",
                  py: "10px",
                },
              }}
            >
              <MenuItem value="Owner">Proprietario</MenuItem>
              <MenuItem value="Tenant">Inquilino</MenuItem>
            </TextField>
            <TextField
              label="Inicio"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.startDate || ""}
              onChange={(e) => handleChange("startDate", e.target.value)}
              error={Boolean(errors.startDate)}
              helperText={errors.startDate}
              fullWidth
              size="small"
              sx={{
                "& input": {
                  fontSize: "14px",
                  py: "10px",
                },
              }}
            />
          </Box>

        </Box>
      );
    }

    return (
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
            Tipo: {getUnitTypeLabel(formData.unitType)}
          </Typography>
          <Typography variant="subtitle2">
            Inicio: {formData.startDate ? moment(formData.startDate).format("DD/MM/YYYY") : "-"}
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderActions = () => {
    if (activeStep === STEPS.length - 1) {
      return (
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : "Criar residente"}
        </Button>
      );
    }

    return (
      <Button variant="contained" sx={{marginTop:2}} onClick={handleNext} disabled={validatingStep}>
        {validatingStep ? <CircularProgress size={20} /> : "Próximo"}
      </Button>
    );
  };

  return (
    <StepWizardCard
      title="Criar residente"
      subtitle={STEPS[activeStep]}
      steps={STEPS}
      activeStep={activeStep}
      showBack={true}
      onBack={() => {
        if (activeStep === 0) {
          onClose();
          return;
        }
        setActiveStep((prev) => prev - 1);
      }}
      onClose={onClose}
      actions={renderActions()}
    >
      {renderStepContent(activeStep)}
    </StepWizardCard>
  );
};

export default ResidenteForm;
