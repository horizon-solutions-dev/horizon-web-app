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
  const [allocationTypes, setAllocationTypes] = useState<AllocationTypeEnum[]>(
    [],
  );
  const [allocationLoading, setAllocationLoading] = useState(false);
  const [allocationError, setAllocationError] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [cepData, setCepData] = useState<{
    address: string;
    neighborhood: string;
    city: string;
    state: string;
  } | null>(null);
  const [cepSearched, setCepSearched] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CondominiumRequest>(initialFormData);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = ["Informações Básicas", "Endereço", "Configurações e Rateio"];

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
    setCepData(null);
    setCepError(null);
    setCepSearched(false);
    setCoverFile(null);
    ensureOrganizationId();

    if (editingCondominium) {
      setEditingId(editingCondominium.condominiumId);
      setFormData({
        organizationId: editingCondominium.organizationId,
        name: editingCondominium.name,
        doc: editingCondominium.doc,
        address: editingCondominium.address,
        addressNumber: editingCondominium.addressNumber,
        complement: editingCondominium.complement,
        neighborhood: editingCondominium.neighborhood,
        city: editingCondominium.city,
        state: editingCondominium.state,
        zipCode: editingCondominium.zipCode,
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
      setCepSearched(true);
    } else {
      setEditingId(null);
      setFormData({
        ...initialFormData,
        organizationId: localStorage.getItem("organizationId") || "",
      });
    }
  }, [open, editingCondominium]);

  if (!open) return null;

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 14) {
      return numbers
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return value;
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d)/, "$1-$2");
    }
    return value;
  };

  const handleChange = (field: string, value: unknown) => {
    let processedValue = value;

    if (field === "doc") {
      processedValue = formatCNPJ(String(value));
    } else if (field === "zipCode") {
      processedValue = formatCEP(String(value));
      const cepDigits = String(value).replace(/\D/g, "");
      if (cepDigits.length !== 8) {
        setCepData(null);
        setCepError(null);
        setCepSearched(false);
      }
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.organizationId.trim())
        newErrors.organizationId = "Organização é obrigatória";
      if (!formData.name.trim()) newErrors.name = "Nome é obrigatório";
      if (!formData.doc.trim()) newErrors.doc = "CNPJ é obrigatório";
      if (!formData.condominiumType)
        newErrors.condominiumType = "Tipo é obrigatório";
      if (formData.unitCount <= 0)
        newErrors.unitCount = "Quantidade deve ser maior que 0";
    } else if (step === 1) {
      if (!formData.zipCode.trim()) newErrors.zipCode = "CEP é obrigatório";
      if (!formData.addressNumber.trim())
        newErrors.addressNumber = "Número é obrigatório";
      if (!formData.address.trim())
        newErrors.address = "Endereço é obrigatório";
      if (!formData.neighborhood.trim())
        newErrors.neighborhood = "Bairro é obrigatório";
      if (!formData.city.trim()) newErrors.city = "Cidade é obrigatória";
      if (!formData.state.trim()) newErrors.state = "Estado é obrigatório";
    } else if (step === 2) {
      if (
        formData.allocationValuePerc < 0 ||
        formData.allocationValuePerc > 100
      ) {
        newErrors.allocationValuePerc = "Percentual deve estar entre 0 e 100";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(activeStep)) return;
    const payload: CondominiumRequest = {
      ...formData,
      condominiumType: normalizeCondominiumTypeValue(formData.condominiumType),
      allocationType: normalizeAllocationTypeValue(formData.allocationType),
      commit: false,
    };

    condominiumService
      .validateCondominium(payload)
      .then(({ valid, validations }) => {
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
                  "addressNumber",
                  "address",
                  "neighborhood",
                  "city",
                  "state",
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
      })
      .catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao validar dados do condominio.";
        console.error(message);
      });
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleCepLookup = async () => {
    const cepDigits = formData.zipCode.replace(/\D/g, "");

    if (cepDigits.length > 0 && cepDigits.length < 8) {
      setCepError("CEP incompleto. Digite 8 dígitos.");
      setCepData(null);
      setCepSearched(true);
      return;
    }

    if (cepDigits.length !== 8) {
      setCepError(null);
      setCepData(null);
      setCepSearched(false);
      return;
    }

    setCepLoading(true);
    setCepError(null);
    setCepSearched(true);

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepDigits}/json/`,
      );
      const data = await response.json();
      if (data?.erro) {
        setCepError("CEP não encontrado.");
        setCepData(null);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      const cepInfo = {
        address: data.logradouro || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
      };

      setCepData(cepInfo);

      setFormData((prev) => ({
        ...prev,
        address: cepInfo.address || prev.address,
        neighborhood: cepInfo.neighborhood || prev.neighborhood,
        city: cepInfo.city || prev.city,
        state: cepInfo.state || prev.state,
      }));
    } catch {
      setCepError("Erro ao consultar CEP.");
      setCepData(null);
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
    if (!validateStep(activeStep)) return;
    if (!formData.organizationId.trim()) {
      onNotify("OrganizationId não encontrado.", "error");
      return;
    }

    try {
      setLoading(true);
      const payload: CondominiumRequest = {
        ...formData,
        condominiumType: normalizeCondominiumTypeValue(
          formData.condominiumType,
        ),
        allocationType: normalizeAllocationTypeValue(formData.allocationType),
        commit: true,
      };

      if (editingId) {
        const response = await condominiumService.updateCondominium(
          editingId,
          payload,
        );
        onNotify(
          `Condomínio atualizado com sucesso! ID: ${response.condominiumId}`,
          "success",
        );
      } else {
        const response = await condominiumService.createCondominium(payload);
        onNotify(
          `Condomínio criado com sucesso! ID: ${response.condominiumId}`,
          "success",
        );
        if (coverFile) {
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
                : "Condomínio criado, mas houve erro ao enviar a imagem de capa.";
            onNotify(message, "error");
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
      setCepData(null);
      setCepSearched(false);
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
    setCepData(null);
    setCepError(null);
    setCepSearched(false);
    onClose();
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
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
            <TextField
              fullWidth
              label={formData.zipCode ? "" : "CEP"}
              value={formData.zipCode}
              onChange={(e) => handleChange("zipCode", e.target.value)}
              onBlur={handleCepLookup}
              error={!!errors.zipCode || !!cepError}
              helperText={
                errors.zipCode ||
                cepError ||
                "Informe o CEP para buscar automaticamente"
              }
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

            <Box sx={{ mt: 0.5 }}>
              {cepSearched && cepData && (
                <Alert 
                  severity="success" 
                  sx={{ 
                    mb: 1.5,
                    fontSize: "12px",
                    py: 0.5,
                    "& .MuiAlert-message": {
                      fontWeight: 600
                    }
                  }}
                >
                  Endereço encontrado! Complete Número e Complemento
                </Alert>
              )}
              
              {cepSearched && !cepData && cepError && (
                <Alert 
                  severity="warning" 
                  sx={{ 
                    mb: 1.5,
                    fontSize: "12px",
                    py: 0.5,
                    "& .MuiAlert-message": {
                      fontWeight: 600
                    }
                  }}
                >
                  CEP não encontrado. Preencha os campos manualmente
                </Alert>
              )}

              {!cepSearched && (
                <Alert 
                  severity="info" 
                  sx={{ 
                    mb: 1.5,
                    fontSize: "12px",
                    py: 0.5,
                    "& .MuiAlert-message": {
                      fontWeight: 600
                    }
                  }}
                >
                  Informe o CEP acima para pesquisar o endereço
                </Alert>
              )}
              
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
                    disabled={!cepSearched || (cepSearched && cepData !== null)} 
                    InputProps={{
                      sx: (!cepSearched || (cepSearched && cepData !== null)) ? {
                        background: "#f5f7fa !important",
                        color: "#666 !important"
                      } : {}
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={formData.neighborhood ? "" : "Bairro"}
                    value={formData.neighborhood}
                    onChange={(e) => handleChange("neighborhood", e.target.value)}
                    error={!!errors.neighborhood}
                    helperText={errors.neighborhood}
                    size="small"
                    InputLabelProps={{ shrink: false }}
                    disabled={!cepSearched || (cepSearched && cepData !== null)}
                    InputProps={{
                      sx: (!cepSearched || (cepSearched && cepData !== null)) ? {
                        background: "#f5f7fa !important",
                        color: "#666 !important"
                      } : {}
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={formData.city ? "" : "Cidade"}
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    error={!!errors.city}
                    helperText={errors.city}
                    size="small"
                    InputLabelProps={{ shrink: false }}
                    disabled={!cepSearched || (cepSearched && cepData !== null)}
                    InputProps={{
                      sx: (!cepSearched || (cepSearched && cepData !== null)) ? {
                        background: "#f5f7fa !important",
                        color: "#666 !important"
                      } : {}
                    }}
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
                    disabled={!cepSearched || (cepSearched && cepData !== null)}
                    InputProps={{
                      sx: (!cepSearched || (cepSearched && cepData !== null)) ? {
                        background: "#f5f7fa !important",
                        color: "#666 !important"
                      } : {}
                    }}
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
                    disabled={!cepSearched}
                    InputProps={{
                      sx: !cepSearched ? {
                        background: "#f5f7fa !important",
                        color: "#666 !important"
                      } : {}
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={formData.complement ? "" : "Complemento"}
                    value={formData.complement}
                    onChange={(e) => handleChange("complement", e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: false }}
                    disabled={!cepSearched}
                    InputProps={{
                      sx: !cepSearched ? {
                        background: "#f5f7fa !important",
                        color: "#666 !important"
                      } : {}
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 700, 
                color: "#1976d2", 
                mb: 0.5,
                fontSize: "14px"
              }}
            >
              Infraestrutura
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

            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 700, 
                color: "#1976d2", 
                mt: 1,
                mb: 0.5,
                fontSize: "14px"
              }}
            >
              Rateio
            </Typography>
            <Grid container spacing={1.2}>
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
                  helperText={allocationError || errors.allocationType}
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

            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 700, 
                color: "#1976d2", 
                mt: 1,
                mb: 0.5,
                fontSize: "14px"
              }}
            >
              Logotipo do condomínio (opcional)
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flexWrap: "wrap",
              }}
            >
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
                {coverFile ? coverFile.name : "Nenhum arquivo"}
              </Typography>
            </Box>
            {editingId && (
              <Alert severity="info" sx={{ py: 0.5, fontSize: "12px" }}>
                Troca de logotipo no editar será habilitada em breve.
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
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
            {loading
              ? editingId
                ? "Atualizando..."
                : "Criando..."
              : "Concluir"}
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
  );
};

export default CondominioForm;