import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Grid,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  condominiumService,
  type Condominium,
  type CondominiumRequest,
  type CondominiumTypeEnum,
  type AllocationTypeEnum,
} from "../../services/condominiumService";
import { condominiumImageService } from "../../services/condominiumImageService";
import { organizationService } from "../../services/organizationService";
import StepWizardCard from "../../shared/components/StepWizardCard";

interface CondominioFormProps {
  open: boolean;
  editingCondominium: Condominium | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  onNotify: (
    message: string,
    severity?: "success" | "error" | "info" | "warning",
  ) => void;
  condominiumTypes: CondominiumTypeEnum[];
  typesLoading: boolean;
  typesError: string | null;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const CondominioForm: React.FC<CondominioFormProps> = ({
  open,
  editingCondominium,
  onClose,
  onSaved,
  onNotify,
  condominiumTypes,
  typesLoading,
  typesError,
  loading,
  setLoading,
}) => {
  const initialFormData: CondominiumRequest = {
    organizationId: localStorage.getItem("organizationId") || "",
    name: "",
    doc: "",
    address: "",
    addressNumber: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    condominiumType: 1,
    unitCount: 0,
    hasBlocks: false,
    hasWaterIndividual: false,
    hasPowerByBlock: false,
    hasGasByBlock: false,
    allocationType: "FractionalAllocation",
    allocationValuePerc: 0,
    commit: true,
  };

  const [activeStep, setActiveStep] = useState(0);
  const [allocationTypes, setAllocationTypes] = useState<AllocationTypeEnum[]>([]);
  const [allocationLoading, setAllocationLoading] = useState(false);
  const [allocationError, setAllocationError] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CondominiumRequest>(initialFormData);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successSnackbar, setSuccessSnackbar] = useState({
    open: false,
    message: "",
  });

  const steps = ["Informações Básicas", "Endereço", "Configurações e Rateio"];

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length === 0) return "";
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return numbers.replace(/(\d{2})(\d+)/, "$1.$2");
    if (numbers.length <= 8) return numbers.replace(/(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
    if (numbers.length <= 12) return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, "$1.$2.$3/$4");
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, "$1.$2.$3/$4-$5");
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length === 0) return "";
    if (numbers.length <= 5) return numbers;
    return numbers.replace(/(\d{5})(\d+)/, "$1-$2");
  };

  const loadAllocationTypes = async () => {
    setAllocationLoading(true);
    setAllocationError(null);
    try {
      const data = await condominiumService.getAllocationTypes();
      setAllocationTypes(data ?? []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao carregar tipos de alocação.";
      setAllocationError(message);
      onNotify(message, "error");
    } finally {
      setAllocationLoading(false);
    }
  };

  const ensureOrganizationId = async () => {
    let organizationId = localStorage.getItem("organizationId") || "";
    if (!organizationId) {
      organizationId =
        (await organizationService.getMyOrganizationId()) || "";
      localStorage.setItem("organizationId", organizationId);
    }

    if (organizationId) {
      setFormData((prev) => ({ ...prev, organizationId }));
    }
  };

  useEffect(() => {
    loadAllocationTypes();
  }, []);

  useEffect(() => {
    if (!open) return;
    setActiveStep(0);
    setErrors({});
    setCepError(null);
    setCoverFile(null);
    ensureOrganizationId();

    if (editingCondominium) {
      setEditingId(editingCondominium.condominiumId);
      setFormData({
        organizationId: editingCondominium.organizationId,
        name: editingCondominium.name,
        doc: formatCNPJ(editingCondominium.doc || ""),
        address: editingCondominium.address,
        addressNumber: editingCondominium.addressNumber,
        complement: editingCondominium.complement,
        neighborhood: editingCondominium.neighborhood,
        city: editingCondominium.city,
        state: editingCondominium.state,
        zipCode: formatCEP(editingCondominium.zipCode || ""),
        condominiumType: normalizeCondominiumTypeValue(
          editingCondominium.condominiumType,
        ),
        unitCount: editingCondominium.unitCount,
        hasBlocks: editingCondominium.hasBlocks,
        hasWaterIndividual: editingCondominium.hasWaterIndividual,
        hasPowerByBlock: editingCondominium.hasPowerByBlock,
        hasGasByBlock: editingCondominium.hasGasByBlock,
        allocationType: normalizeAllocationTypeValue(
          editingCondominium.allocationType,
        ),
        allocationValuePerc: editingCondominium.allocationValuePerc,
        commit: true,
      });
    } else {
      setEditingId(null);
      setFormData({
        ...initialFormData,
        organizationId: localStorage.getItem("organizationId") || "",
      });
    }
  }, [open, editingCondominium]);

  if (!open) return null;

  const handleChange = (field: string, value: unknown) => {
    let processedValue = value;

    if (field === "doc") {
      processedValue = formatCNPJ(String(value));
    } else if (field === "zipCode") {
      processedValue = formatCEP(String(value));
      const cepDigits = String(value).replace(/\D/g, "");
      if (cepDigits.length !== 8) {
        setCepError(null);
      }
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNext = async () => {
    // Remove formatação do CNPJ e CEP antes de validar
    const cleanDoc = formData.doc.replace(/\D/g, "");
    const cleanZipCode = formData.zipCode.replace(/\D/g, "");
    
    const payload: CondominiumRequest = {
      ...formData,
      doc: cleanDoc,
      zipCode: cleanZipCode,
      condominiumType: normalizeCondominiumTypeValue(formData.condominiumType),
      allocationType: normalizeAllocationTypeValue(formData.allocationType),
      commit: false,
    };

    try {
      const { valid, validations } = await condominiumService.validateCondominium(payload);
      
      if (valid || validations.length === 0) {
        setActiveStep((prev) => prev + 1);
        return;
      }

      const fieldMap: Record<string, keyof CondominiumRequest> = {
        organizationid: "organizationId",
        name: "name",
        doc: "doc",
        address: "address",
        addressnumber: "addressNumber",
        complement: "complement",
        neighborhood: "neighborhood",
        city: "city",
        state: "state",
        zipcode: "zipCode",
        condominiumtype: "condominiumType",
        unitcount: "unitCount",
        hasblocks: "hasBlocks",
        haswaterindividual: "hasWaterIndividual",
        haspowerbyblock: "hasPowerByBlock",
        hasgasbyblock: "hasGasByBlock",
        allocationtype: "allocationType",
        allocationvalueperc: "allocationValuePerc",
        commit: "commit",
      };

      const stepFields: Array<keyof CondominiumRequest> =
        activeStep === 0
          ? ["organizationId", "name", "doc", "condominiumType", "unitCount"]
          : activeStep === 1
            ? [
                "zipCode",
                "address",
                "addressNumber",
                "neighborhood",
                "city",
                "state",
                "complement",
              ]
            : [
                "hasBlocks",
                "hasWaterIndividual",
                "hasPowerByBlock",
                "hasGasByBlock",
                "allocationType",
                "allocationValuePerc",
              ];

      const nextErrors: Record<string, string> = {};

      validations.forEach((validation) => {
        const key = validation.field?.replace(/\s+/g, "").toLowerCase();
        const field = key ? fieldMap[key] : undefined;
        if (field && stepFields.includes(field)) {
          nextErrors[field] = validation.message;
        }
      });

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }

      setActiveStep((prev) => prev + 1);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao validar dados do condomínio.";
      onNotify(message, "error");
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleCepLookup = async () => {
    const cepDigits = formData.zipCode.replace(/\D/g, "");

    if (cepDigits.length > 0 && cepDigits.length < 8) {
      setCepError("CEP incompleto. Digite 8 dígitos.");
      return;
    }

    if (cepDigits.length !== 8) {
      setCepError(null);
      return;
    }

    setCepLoading(true);
    setCepError(null);

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepDigits}/json/`,
      );
      const data = await response.json();
      if (data?.erro) {
        setCepError("CEP não encontrado.");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        address: data.logradouro || prev.address,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao consultar CEP.";
      setCepError(message);
    } finally {
      setCepLoading(false);
    }
  };

  const normalizeAllocationTypeValue = (value: string | number) => {
    const match = allocationTypes.find(
      (type) => type.id === value || type.value === value,
    );
    return match?.id ?? value;
  };

  const normalizeCondominiumTypeValue = (value: string | number) => {
    const match = condominiumTypes.find(
      (type) => type.id === value || type.value === value,
    );
    return match?.id ?? value;
  };

  const handleSubmit = async () => {
    if (!formData.organizationId.trim()) {
      onNotify("OrganizationId não encontrado.", "error");
      return;
    }

    try {
      setLoading(true);
      
      // Remove formatação do CNPJ e CEP antes de enviar
      const cleanDoc = formData.doc.replace(/\D/g, "");
      const cleanZipCode = formData.zipCode.replace(/\D/g, "");
      
      const payload: CondominiumRequest = {
        ...formData,
        doc: cleanDoc,
        zipCode: cleanZipCode,
        condominiumType: normalizeCondominiumTypeValue(
          formData.condominiumType,
        ),
        allocationType: normalizeAllocationTypeValue(formData.allocationType),
        commit: true,
      };

      const validationPayload: CondominiumRequest = {
        ...payload,
        commit: false,
      };

      const { valid, validations } = await condominiumService.validateCondominium(
        validationPayload,
      );

      if (!valid && validations.length > 0) {
        const fieldMap: Record<string, keyof CondominiumRequest> = {
          organizationid: "organizationId",
          name: "name",
          doc: "doc",
          address: "address",
          addressnumber: "addressNumber",
          complement: "complement",
          neighborhood: "neighborhood",
          city: "city",
          state: "state",
          zipcode: "zipCode",
          condominiumtype: "condominiumType",
          unitcount: "unitCount",
          hasblocks: "hasBlocks",
          haswaterindividual: "hasWaterIndividual",
          haspowerbyblock: "hasPowerByBlock",
          hasgasbyblock: "hasGasByBlock",
          allocationtype: "allocationType",
          allocationvalueperc: "allocationValuePerc",
          commit: "commit",
        };

        const stepFields: Array<Array<keyof CondominiumRequest>> = [
          ["organizationId", "name", "doc", "condominiumType", "unitCount"],
          [
            "zipCode",
            "address",
            "addressNumber",
            "neighborhood",
            "city",
            "state",
            "complement",
          ],
          [
            "hasBlocks",
            "hasWaterIndividual",
            "hasPowerByBlock",
            "hasGasByBlock",
            "allocationType",
            "allocationValuePerc",
          ],
        ];

        const nextErrors: Record<string, string> = {};
        let targetStep = 0;

        validations.forEach((validation) => {
          const key = validation.field?.replace(/\s+/g, "").toLowerCase();
          const field = key ? fieldMap[key] : undefined;
          if (!field) return;
          nextErrors[field] = validation.message;
          const stepIndex = stepFields.findIndex((fields) => fields.includes(field));
          if (stepIndex >= 0) {
            targetStep = Math.max(targetStep, stepIndex);
          }
        });

        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          setActiveStep(targetStep);
          return;
        }
      }

      if (editingId) {
        await condominiumService.updateCondominium(editingId, payload);
        setSuccessSnackbar({
          open: true,
          message: `Condomínio "${formData.name}" atualizado com sucesso!`,
        });
      } else {
        const response = await condominiumService.createCondominium(payload);
        setSuccessSnackbar({
          open: true,
          message: `Condomínio "${formData.name}" criado com sucesso!`,
        });
        
        if (coverFile && response?.condominiumId) {
          try {
            await condominiumImageService.uploadCondominiumImage({
              imageType: "Cover",
              contentFile: coverFile,
              condominiumId: response.condominiumId,
            });
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Erro ao enviar imagem de capa.";
            onNotify(message, "warning");
          }
        }
      }

      await onSaved();
      setFormData({
        ...initialFormData,
        organizationId: localStorage.getItem("organizationId") || "",
      });
      setCoverFile(null);
      setActiveStep(0);
      setEditingId(null);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : editingId
            ? "Erro ao atualizar condomínio!"
            : "Erro ao criar condomínio!";
      onNotify(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseWizard = () => {
    setEditingId(null);
    setActiveStep(0);
    setFormData({
      ...initialFormData,
      organizationId: localStorage.getItem("organizationId") || "",
    });
    setCoverFile(null);
    setErrors({});
    setCepError(null);
    onClose();
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            <Typography variant="subtitle2" className="step-subtitle">
              Informações Básicas
            </Typography>
            <TextField
              fullWidth
              label={formData.name ? "" : "Nome do Condomínio"}
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              size="small"
              InputLabelProps={{ shrink: false }}
            />
            <TextField
              fullWidth
              label={formData.doc ? "" : "CNPJ"}
              value={formData.doc}
              onChange={(e) => handleChange("doc", e.target.value)}
              error={!!errors.doc}
              helperText={errors.doc}
              placeholder="00.000.000/0000-00"
              size="small"
              InputLabelProps={{ shrink: false }}
              inputProps={{ maxLength: 18 }}
            />
            <TextField
              fullWidth
              label="Tipo de Condomínio"
              select
              value={formData.condominiumType}
              onChange={(e) =>
                handleChange(
                  "condominiumType",
                  normalizeCondominiumTypeValue(e.target.value as string),
                )
              }
              error={!!errors.condominiumType}
              helperText={typesError || errors.condominiumType}
              size="small"
            >
              {typesLoading ? (
                <MenuItem value={formData.condominiumType} disabled>
                  Carregando...
                </MenuItem>
              ) : condominiumTypes.length > 0 ? (
                condominiumTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.description || type.value}
                  </MenuItem>
                ))
              ) : (
                <>
                  <MenuItem value="Residential">Residencial</MenuItem>
                  <MenuItem value="Commercial">Comercial</MenuItem>
                  <MenuItem value="Mixed">Misto</MenuItem>
                </>
              )}
            </TextField>
            <TextField
              fullWidth
              label={formData.unitCount > 0 ? "" : "Quantidade de Unidades"}
              type="number"
              value={formData.unitCount || ""}
              onChange={(e) =>
                handleChange("unitCount", parseInt(e.target.value) || 0)
              }
              error={!!errors.unitCount}
              helperText={errors.unitCount}
              size="small"
              InputLabelProps={{ shrink: false }}
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            <Typography variant="subtitle2" className="step-subtitle">
              Endereço
            </Typography>
            <TextField
              fullWidth
              label={formData.zipCode ? "" : "CEP"}
              value={formData.zipCode}
              onChange={(e) => handleChange("zipCode", e.target.value)}
              onBlur={handleCepLookup}
              error={!!errors.zipCode || !!cepError}
              helperText={errors.zipCode || cepError}
              placeholder="00000-000"
              size="small"
              InputLabelProps={{ shrink: false }}
              inputProps={{ maxLength: 9 }}
              InputProps={{
                endAdornment: cepLoading ? (
                  <CircularProgress size={18} />
                ) : null,
              }}
            />
            <Grid container spacing={1.2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={formData.address ? "" : "Logradouro"}
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  error={!!errors.address}
                  helperText={errors.address}
                  size="small"
                  InputLabelProps={{ shrink: false }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label={formData.addressNumber ? "" : "Número"}
                  value={formData.addressNumber}
                  onChange={(e) => handleChange("addressNumber", e.target.value)}
                  error={!!errors.addressNumber}
                  helperText={errors.addressNumber}
                  size="small"
                  InputLabelProps={{ shrink: false }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label={formData.complement ? "" : "Complemento"}
                  value={formData.complement}
                  onChange={(e) => handleChange("complement", e.target.value)}
                  error={!!errors.complement}
                  helperText={errors.complement}
                  size="small"
                  InputLabelProps={{ shrink: false }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label={formData.neighborhood ? "" : "Bairro"}
                  value={formData.neighborhood}
                  onChange={(e) => handleChange("neighborhood", e.target.value)}
                  error={!!errors.neighborhood}
                  helperText={errors.neighborhood}
                  size="small"
                  InputLabelProps={{ shrink: false }}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label={formData.city ? "" : "Cidade"}
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  error={!!errors.city}
                  helperText={errors.city}
                  size="small"
                  InputLabelProps={{ shrink: false }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label={formData.state ? "" : "UF"}
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value.toUpperCase())}
                  error={!!errors.state}
                  helperText={errors.state}
                  size="small"
                  InputLabelProps={{ shrink: false }}
                  inputProps={{ maxLength: 2 }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            <Typography variant="subtitle2" className="step-subtitle">
              Configurações e Rateio
            </Typography>
            <Grid container spacing={0.8}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.hasBlocks}
                      onChange={(e) => handleChange("hasBlocks", e.target.checked)}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontSize: "13px" }}>Possui blocos</Typography>}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.hasWaterIndividual}
                      onChange={(e) =>
                        handleChange("hasWaterIndividual", e.target.checked)
                      }
                      size="small"
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontSize: "13px" }}>Medição individual de água</Typography>}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.hasPowerByBlock}
                      onChange={(e) =>
                        handleChange("hasPowerByBlock", e.target.checked)
                      }
                      size="small"
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontSize: "13px" }}>Energia por bloco</Typography>}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.hasGasByBlock}
                      onChange={(e) =>
                        handleChange("hasGasByBlock", e.target.checked)
                      }
                      size="small"
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontSize: "13px" }}>Gás por bloco</Typography>}
                />
              </Grid>
            </Grid>

            <Grid container spacing={1.2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tipo de rateio"
                  select
                  value={formData.allocationType}
                  onChange={(e) =>
                    handleChange(
                      "allocationType",
                      normalizeAllocationTypeValue(e.target.value as string),
                    )
                  }
                  error={!!errors.allocationType}
                  helperText={errors.allocationType || allocationError}
                  size="small"
                >
                  {allocationLoading ? (
                    <MenuItem value={formData.allocationType} disabled>
                      Carregando...
                    </MenuItem>
                  ) : allocationTypes.length > 0 ? (
                    allocationTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.description || type.value}
                      </MenuItem>
                    ))
                  ) : (
                    <>
                      <MenuItem value="FractionalAllocation">
                        Rateio fracionário
                      </MenuItem>
                      <MenuItem value="FixedAllocation">Rateio fixo</MenuItem>
                      <MenuItem value="ProportionalAllocation">
                        Rateio proporcional
                      </MenuItem>
                    </>
                  )}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={formData.allocationValuePerc > 0 ? "" : "Percentual de rateio (%)"}
                  type="number"
                  value={formData.allocationValuePerc || ""}
                  onChange={(e) =>
                    handleChange("allocationValuePerc", parseFloat(e.target.value) || 0)
                  }
                  error={!!errors.allocationValuePerc}
                  helperText={errors.allocationValuePerc}
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  size="small"
                  InputLabelProps={{ shrink: false }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Button 
                variant="outlined" 
                component="label" 
                size="small"
                sx={{
                  minWidth: 130,
                  height: 36,
                  textTransform: 'none',
                  fontSize: '13px',
                }}
              >
                Selecionar imagem
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                />
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px" }}>
                {coverFile ? coverFile.name : "Nenhuma imagem selecionada"}
              </Typography>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <StepWizardCard
        title={editingId ? "Editar condomínio" : "Criar condomínio"}
        subtitle={steps[activeStep]}
        steps={steps}
        onClose={handleCloseWizard}
        activeStep={activeStep}
        showBack={activeStep > 0 && activeStep < steps.length}
        onBack={handleBack}
      >
        <div className="condominio-form">
          {renderStepContent(activeStep)}
        </div>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 2,
            mt: 1.5,
            pt: 1.5,
            borderTop: "2px solid #f0f2f5",
          }}
        >
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : "Concluir"}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
            >
              Próximo
            </Button>
          )}
        </Box>
      </StepWizardCard>

      {/* Snackbar de Sucesso - Interno ao Form */}
      <Snackbar
        open={successSnackbar.open}
        autoHideDuration={4000}
        onClose={() => setSuccessSnackbar({ open: false, message: "" })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{
          top: "32px !important",
          "& .MuiAlert-root": {
            minWidth: "400px",
            borderRadius: "16px",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.2)",
          }
        }}
      >
        <Alert
          onClose={() => setSuccessSnackbar({ open: false, message: "" })}
          severity="success"
          variant="filled"
          sx={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "white",
            fontSize: "15px",
            fontWeight: 600,
            "& .MuiAlert-icon": {
              color: "white",
              fontSize: "26px",
            },
          }}
        >
          {successSnackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CondominioForm;
