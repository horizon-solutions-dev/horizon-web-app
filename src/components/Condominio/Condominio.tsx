import React, { useEffect, useState } from "react";
import "./Condominio.scss";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Snackbar,
  Alert,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  IconButton,
  Tooltip,
  Grid,
  Fade,
  Zoom,
} from "@mui/material";

import {
  Business,
  CheckCircle,
  DeleteOutline,
  EditOutlined,
  HomeOutlined,
  BusinessOutlined,
  ApartmentOutlined,
  LocationOnOutlined,
  Close,
  AutoAwesome,
} from "@mui/icons-material";
import {
  condominiumService,
  type Condominium,
  type CondominiumRequest,
  type CondominiumTypeEnum,
  type AllocationTypeEnum,
} from "../../services/condominiumService";
import { condominiumImageService } from "../../services/condominiumImageService";
import { organizationService } from "../../services/organizationService";
import CardList from "../../shared/components/CardList";
import StepWizardCard from "../../shared/components/StepWizardCard";
import "./Condominio.scss";

const CondominioForm: React.FC = () => {
  const navigate = useNavigate();
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
  };

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [condominiumImages, setCondominiumImages] = useState<
    Record<string, string>
  >({});
  const [searchText, setSearchText] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [listPage, setListPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 4;
  const [condominiumTypes, setCondominiumTypes] = useState<
    CondominiumTypeEnum[]
  >([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [allocationTypes, setAllocationTypes] = useState<AllocationTypeEnum[]>(
    [],
  );
  const [allocationLoading, setAllocationLoading] = useState(false);
  const [allocationError, setAllocationError] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [cepAutoFilled, setCepAutoFilled] = useState(false);
  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CondominiumRequest>(initialFormData);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const steps = ["Informações Básicas", "Endereço", "Configurações e Rateio"];

  const loadCondominiums = async (pageNumber = 1) => {
    setListLoading(true);
    setListError(null);
    try {
      let organizationId = localStorage.getItem("organizationId") || "";
      if (!organizationId) {
        organizationId =
          (await organizationService.getMyOrganizationId()) || "";
        localStorage.setItem("organizationId", organizationId);
      }

      setFormData((prev) => ({ ...prev, organizationId }));

      const response = await condominiumService.getCondominiums(
        organizationId,
        pageNumber,
        pageSize,
      );
      if (!organizationName) {
        try {
          const organizations = await organizationService.getMyOrganization();
          const orgName =
            organizations?.[0]?.name || organizations?.[0]?.legalName;
          if (orgName) setOrganizationName(orgName);
        } catch {
          // ignore organization name errors
        }
      }
      const normalized = response?.data ?? [];
      const computedTotalPages =
        response?.totalPages ??
        Math.max(
          1,
          Math.ceil((response?.total ?? normalized.length) / pageSize),
        );
      setListPage(response?.pageNumber ?? pageNumber);
      setTotalPages(computedTotalPages);
      setCondominiums(normalized);
      await loadCondominiumImages(normalized);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao carregar condomínios.";
      setListError(message);
    } finally {
      setListLoading(false);
    }
  };

  const loadCondominiumImages = async (items: Condominium[]) => {
    const previews: Record<string, string> = {};
    await Promise.all(
      items.map(async (condominium) => {
        try {
          const list = await condominiumImageService.getCondominiumImages(
            condominium.condominiumId,
            "Cover",
          );
          const first = list?.[0];
          if (!first?.condominiumImageId) return;
          const detail = await condominiumImageService.getCondominiumImageById(
            first.condominiumImageId,
          );
          if (detail?.contentFile && detail?.contentType) {
            previews[condominium.condominiumId] =
              `data:${detail.contentType};base64,${detail.contentFile}`;
          }
        } catch {
          // ignore individual errors
        }
      }),
    );
    setCondominiumImages(previews);
  };

  const loadCondominiumTypes = async () => {
    setTypesLoading(true);
    setTypesError(null);
    try {
      const data = await condominiumService.getCondominiumTypes();
      setCondominiumTypes(data ?? []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao carregar tipos de condomínio.";
      setTypesError(message);
    } finally {
      setTypesLoading(false);
    }
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
    } finally {
      setAllocationLoading(false);
    }
  };

  useEffect(() => {
    loadCondominiums(1);
    loadCondominiumTypes();
    loadAllocationTypes();
  }, []);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleCepLookup = async () => {
    const cepDigits = formData.zipCode.replace(/\D/g, "");
    if (cepDigits.length !== 8) {
      setCepError("CEP deve conter 8 dígitos.");
      return;
    }

    setCepLoading(true);
    setCepError(null);
    setCepAutoFilled(false);
    
    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepDigits}/json/`,
      );
      const data = await response.json();
      if (data?.erro) {
        setCepError("CEP não encontrado.");
        return;
      }

      // Animação de preenchimento automático
      setCepAutoFilled(true);
      
      // Pequeno delay para efeito visual
      await new Promise(resolve => setTimeout(resolve, 300));

      setFormData((prev) => ({
        ...prev,
        address: data.logradouro || prev.address,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }));

      // Remove o indicador após 2 segundos
      setTimeout(() => setCepAutoFilled(false), 2000);
    } catch {
      setCepError("Erro ao consultar CEP.");
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

  const getCondominiumTypeLabel = (value: string | number) => {
    const match = condominiumTypes.find(
      (type) => type.id === value || type.value === value,
    );
    return match?.description || match?.value || String(value);
  };

  const normalizeCondominiumTypeValue = (value: string | number) => {
    const match = condominiumTypes.find(
      (type) => type.id === value || type.value === value,
    );
    return match?.id ?? value;
  };

  const handleEdit = (condominium: Condominium) => {
    setEditingId(condominium.condominiumId);
    setFormData({
      organizationId: condominium.organizationId,
      name: condominium.name,
      doc: condominium.doc,
      address: condominium.address,
      addressNumber: condominium.addressNumber,
      complement: condominium.complement,
      neighborhood: condominium.neighborhood,
      city: condominium.city,
      state: condominium.state,
      zipCode: condominium.zipCode,
      condominiumType: normalizeCondominiumTypeValue(
        condominium.condominiumType,
      ),
      unitCount: condominium.unitCount,
      hasBlocks: condominium.hasBlocks,
      hasWaterIndividual: condominium.hasWaterIndividual,
      hasPowerByBlock: condominium.hasPowerByBlock,
      hasGasByBlock: condominium.hasGasByBlock,
      allocationType: normalizeAllocationTypeValue(condominium.allocationType),
      allocationValuePerc: condominium.allocationValuePerc,
    });
    setActiveStep(0);
    setIsCadastroOpen(true);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;
    if (!formData.organizationId.trim()) {
      setSnackbar({
        open: true,
        message: "OrganizationId não encontrado.",
        severity: "error",
      });
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
      };

      if (editingId) {
        const response = await condominiumService.updateCondominium(
          editingId,
          payload,
        );
        setSnackbar({
          open: true,
          message: `Condomínio atualizado com sucesso! ID: ${response.condominiumId}`,
          severity: "success",
        });
      } else {
        const response = await condominiumService.createCondominium(payload);
        setSnackbar({
          open: true,
          message: `Condomínio criado com sucesso! ID: ${response.condominiumId}`,
          severity: "success",
        });
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
            setSnackbar({
              open: true,
              message,
              severity: "error",
            });
          }
        }
      }

      await loadCondominiums();
      setFormData({
        ...initialFormData,
        organizationId: localStorage.getItem("organizationId") || "",
      });
      setCoverFile(null);
      setActiveStep(0);
      setEditingId(null);
      setIsCadastroOpen(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : editingId
            ? "Erro ao atualizar condomínio!"
            : "Erro ao criar condomínio!";
      setSnackbar({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (condominium: Condominium) => {
    const confirmed = window.confirm(
      `Deseja excluir o condomínio ${condominium.name}?`,
    );
    if (!confirmed) return;
    setSnackbar({
      open: true,
      message: "Exclusão ainda não está disponível.",
      severity: "error",
    });
  };

  const handleCloseWizard = () => {
    setIsCadastroOpen(false);
    setEditingId(null);
    setActiveStep(0);
    setFormData({
      ...initialFormData,
      organizationId: localStorage.getItem("organizationId") || "",
    });
    setCoverFile(null);
    setErrors({});
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            <TextField
              fullWidth
              label="Nome do Condomínio"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              size="small"
            />
            <TextField
              fullWidth
              label="CNPJ"
              value={formData.doc}
              onChange={(e) => handleChange("doc", e.target.value)}
              error={!!errors.doc}
              helperText={errors.doc}
              placeholder="00.000.000/0000-00"
              size="small"
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
              label="Quantidade de Unidades"
              type="number"
              value={formData.unitCount}
              onChange={(e) =>
                handleChange("unitCount", parseInt(e.target.value))
              }
              error={!!errors.unitCount}
              helperText={errors.unitCount}
              size="small"
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            <Box sx={{ position: "relative" }}>
              <TextField
                fullWidth
                label="CEP"
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
                InputProps={{
                  endAdornment: cepLoading ? (
                    <CircularProgress size={18} />
                  ) : null,
                }}
              />
              {cepAutoFilled && (
                <Zoom in={cepAutoFilled}>
                  <Box
                    sx={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "white",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 600,
                      boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                      zIndex: 10,
                    }}
                  >
                    <AutoAwesome sx={{ fontSize: 14 }} />
                    Preenchido!
                  </Box>
                </Zoom>
              )}
            </Box>
            
            <Grid container spacing={1.2}>
              <Grid item xs={12} sm={9}>
                <Fade in={!!formData.address || cepAutoFilled} timeout={600}>
                  <TextField
                    fullWidth
                    label="Endereço (Logradouro)"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    error={!!errors.address}
                    helperText={errors.address}
                    size="small"
                  />
                </Fade>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Número"
                  value={formData.addressNumber}
                  onChange={(e) => handleChange("addressNumber", e.target.value)}
                  error={!!errors.addressNumber}
                  helperText={errors.addressNumber}
                  size="small"
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Complemento (Opcional)"
              value={formData.complement}
              onChange={(e) => handleChange("complement", e.target.value)}
              size="small"
            />
            
            <Fade in={!!formData.neighborhood || cepAutoFilled} timeout={800}>
              <TextField
                fullWidth
                label="Bairro"
                value={formData.neighborhood}
                onChange={(e) => handleChange("neighborhood", e.target.value)}
                error={!!errors.neighborhood}
                helperText={errors.neighborhood}
                size="small"
              />
            </Fade>
            
            <Grid container spacing={1.2}>
              <Grid item xs={12} sm={9}>
                <Fade in={!!formData.city || cepAutoFilled} timeout={1000}>
                  <TextField
                    fullWidth
                    label="Cidade"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    error={!!errors.city}
                    helperText={errors.city}
                    size="small"
                  />
                </Fade>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Fade in={!!formData.state || cepAutoFilled} timeout={1200}>
                  <TextField
                    fullWidth
                    label="UF"
                    value={formData.state}
                    onChange={(e) =>
                      handleChange("state", e.target.value.toUpperCase())
                    }
                    error={!!errors.state}
                    helperText={errors.state}
                    placeholder="SP"
                    inputProps={{ maxLength: 2 }}
                    size="small"
                  />
                </Fade>
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1976d2", mb: 0.5 }}>
              Infraestrutura
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.hasBlocks}
                      onChange={(e) => handleChange("hasBlocks", e.target.checked)}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">Possui Blocos</Typography>}
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
                  label={<Typography variant="body2">Medição Individual de Água</Typography>}
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
                  label={<Typography variant="body2">Energia por Bloco</Typography>}
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
                  label={<Typography variant="body2">Gás por Bloco</Typography>}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1976d2", mt: 1, mb: 0.5 }}>
              Rateio
            </Typography>
            <TextField
              fullWidth
              label="Tipo de Rateio"
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
                    Rateio Fracionário
                  </MenuItem>
                  <MenuItem value="FixedAllocation">Rateio Fixo</MenuItem>
                  <MenuItem value="ProportionalAllocation">
                    Rateio Proporcional
                  </MenuItem>
                </>
              )}
            </TextField>
            <TextField
              fullWidth
              label="Percentual de Rateio (%)"
              type="number"
              value={formData.allocationValuePerc}
              onChange={(e) =>
                handleChange("allocationValuePerc", parseFloat(e.target.value))
              }
              error={!!errors.allocationValuePerc}
              helperText={errors.allocationValuePerc}
              inputProps={{ min: 0, max: 100, step: 0.01 }}
              size="small"
            />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1976d2", mt: 1, mb: 0.5 }}>
              Imagem de capa (opcional)
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flexWrap: "wrap",
              }}
            >
              <Button variant="outlined" component="label" size="small">
                Selecionar imagem
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                />
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "13px" }}>
                {coverFile ? coverFile.name : "Nenhum arquivo"}
              </Typography>
              {editingId ? (
                <Alert severity="info" sx={{ flex: 1, py: 0.5 }}>
                  <Typography variant="caption">
                    Troca de capa no editar será habilitada quando o endpoint estiver disponível.
                  </Typography>
                </Alert>
              ) : null}
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box className="condominio-container">
      <Container maxWidth="xl">
        {isCadastroOpen ? (
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
              sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2, pt: 1.5, borderTop: "2px solid #f0f2f5" }}
            >
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={
                    loading ? <CircularProgress size={18} /> : <CheckCircle />
                  }
                  sx={{ minWidth: 140, height: 42 }}
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
                  sx={{ minWidth: 140, height: 42 }}
                >
                  Próximo
                </Button>
              )}
            </Box>
          </StepWizardCard>
        ) : (
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box
              sx={{
                mb: 2,
                pb: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "2px solid #f0f0f0",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Business sx={{ fontSize: 36, color: "#1976d2" }} />
                <Typography variant="h5" fontWeight="bold" sx={{ fontSize: "26px" }}>
                  {organizationName}
                </Typography>
              </Box>
              <Tooltip title="Fechar">
                <IconButton
                  color="error"
                  onClick={() => {
                    navigate("/dashboard");
                    setIsCadastroOpen(false);
                    setEditingId(null);
                    setActiveStep(0);
                  }}
                  sx={{
                    width: 40,
                    height: 40,
                    borderColor: "divider",
                    backgroundColor: "#f5f5f5",
                  }}
                >
                  <Close />
                </IconButton>
              </Tooltip>
            </Box>

            <Paper variant="outlined" sx={{ p: 2 }}>
              {listLoading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">Carregando...</Typography>
                </Box>
              ) : listError ? (
                <Alert severity="error">{listError}</Alert>
              ) : condominiums.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhum condomínio encontrado para esta organização.
                </Typography>
              ) : (
                <CardList
                  title="Condomínios da organização"
                  showTitle={false}
                  searchPlaceholder="Buscar condomínio..."
                  onSearchChange={setSearchText}
                  onAddClick={() => {
                    setActiveStep(0);
                    setEditingId(null);
                    setFormData({
                      ...initialFormData,
                      organizationId:
                        localStorage.getItem("organizationId") || "",
                    });
                    setIsCadastroOpen(true);
                  }}
                  addLabel="Novo"
                  addButtonPlacement="toolbar"
                  emptyImageLabel="Sem imagem"
                  page={listPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    setListPage(page);
                    loadCondominiums(page);
                  }}
                  items={condominiums
                    .filter((condominium,) =>
                      [condominium.name, condominium.city, condominium.state]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase()
                        .includes(searchText.toLowerCase()),
                    )
                    .map((condominium, index) => ({
                      id: condominium.condominiumId,
                      title: condominium.name,
                      subtitle: (
                        <>
                          <LocationOnOutlined
                            sx={{
                              fontSize: 14,
                              mr: 0.5,
                              verticalAlign: "middle",
                            }}
                          />
                          {condominium.city} - {condominium.state}
                        </>
                      ),
                      accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                      meta: (
                        <>
                          {condominium.condominiumType === "Commercial" ||
                          getCondominiumTypeLabel(
                            condominium.condominiumType,
                          ) === "Comercial" ? (
                            <BusinessOutlined
                              sx={{
                                fontSize: 14,
                                mr: 0.5,
                                verticalAlign: "middle",
                              }}
                            />
                          ) : getCondominiumTypeLabel(
                              condominium.condominiumType,
                            ) === "Residencial" ? (
                            <HomeOutlined
                              sx={{
                                fontSize: 14,
                                mr: 0.5,
                                verticalAlign: "middle",
                              }}
                            />
                          ) : (
                            <ApartmentOutlined
                              sx={{
                                fontSize: 14,
                                mr: 0.5,
                                verticalAlign: "middle",
                              }}
                            />
                          )}
                          {getCondominiumTypeLabel(condominium.condominiumType)}
                        </>
                      ),
                      imageUrl: condominiumImages[condominium.condominiumId],
                      actions: (
                        <Box
                          sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            className="action-button-edit"
                            startIcon={<EditOutlined sx={{ fontSize: "16px !important" }} />}
                            onClick={() => handleEdit(condominium)}
                            sx={{ 
                              minWidth: "80px !important",
                              height: "32px !important",
                              fontSize: "12px !important",
                              padding: "0 12px !important"
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            className="action-button-delete"
                            startIcon={<DeleteOutline sx={{ fontSize: "16px !important" }} />}
                            onClick={() => handleDelete(condominium)}
                            sx={{ 
                              minWidth: "80px !important",
                              height: "32px !important",
                              fontSize: "12px !important",
                              padding: "0 12px !important"
                            }}
                          >
                            Excluir
                          </Button>
                        </Box>
                      ),
                    }))}
                />
              )}
            </Paper>
          </Paper>
        )}
      </Container>

      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CondominioForm;