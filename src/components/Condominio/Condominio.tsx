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
  Card,
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
  Chip,
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
  CheckCircleOutline,
  LocationCity,
  Signpost,
  Public,
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
  const [cepData, setCepData] = useState<{
    address: string;
    neighborhood: string;
    city: string;
    state: string;
  } | null>(null);
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

  // Função para formatar CNPJ
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

  // Função para formatar CEP
  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d)/, "$1-$2");
    }
    return value;
  };

  const handleChange = (field: string, value: unknown) => {
    let processedValue = value;
    
    // Aplicar máscaras
    if (field === "doc") {
      processedValue = formatCNPJ(String(value));
    } else if (field === "zipCode") {
      processedValue = formatCEP(String(value));
      const cepDigits = String(value).replace(/\D/g, "");
      if (cepDigits.length !== 8) {
        setCepData(null);
        setCepError(null);
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
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleCepLookup = async () => {
    const cepDigits = formData.zipCode.replace(/\D/g, "");
    
    // Se CEP incompleto ao perder foco
    if (cepDigits.length > 0 && cepDigits.length < 8) {
      setCepError("CEP incompleto. Digite 8 dígitos.");
      setCepData(null);
      return;
    }
    
    if (cepDigits.length !== 8) {
      setCepError(null);
      setCepData(null);
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
        setCepData(null);
        return;
      }

      // Pequeno delay para efeito visual
      await new Promise(resolve => setTimeout(resolve, 300));

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
      setCepData(null);
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
    setCepData(null);
    setCepError(null);
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

            {/* Informações do CEP - Locked e Bonitas */}
            <Fade in={!!cepData} timeout={500}>
              <Box
                className="cep-info-card"
                sx={{
                  background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                  border: "2px solid #0ea5e9",
                  borderRadius: "12px",
                  padding: "16px",
                  display: cepData ? "flex" : "none",
                  flexDirection: "column",
                  gap: 1.5,
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(14, 165, 233, 0.15)",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "120px",
                    height: "120px",
                    background: "radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%)",
                  }}
                />
                
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <CheckCircleOutline sx={{ color: "#0ea5e9", fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ color: "#0369a1", fontWeight: 700, fontSize: "14px" }}>
                    Endereço encontrado
                  </Typography>
                </Box>

                <Grid container spacing={1.5}>
                  <Grid item xs={12}>
                    <Chip
                      icon={<Signpost sx={{ fontSize: 16 }} />}
                      label={cepData?.address || "Não informado"}
                      sx={{
                        width: "100%",
                        justifyContent: "flex-start",
                        height: "auto",
                        minHeight: "36px",
                        padding: "8px 12px",
                        background: "white",
                        border: "1.5px solid #bae6fd",
                        "& .MuiChip-label": {
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#0c4a6e",
                          whiteSpace: "normal",
                          textAlign: "left",
                        },
                        "& .MuiChip-icon": {
                          color: "#0ea5e9",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Chip
                      icon={<LocationOnOutlined sx={{ fontSize: 16 }} />}
                      label={cepData?.neighborhood || "Não informado"}
                      sx={{
                        width: "100%",
                        justifyContent: "flex-start",
                        height: "auto",
                        minHeight: "36px",
                        padding: "8px 12px",
                        background: "white",
                        border: "1.5px solid #bae6fd",
                        "& .MuiChip-label": {
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#0c4a6e",
                          whiteSpace: "normal",
                          textAlign: "left",
                        },
                        "& .MuiChip-icon": {
                          color: "#0ea5e9",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Chip
                      icon={<LocationCity sx={{ fontSize: 16 }} />}
                      label={`${cepData?.city || ""} - ${cepData?.state || ""}`}
                      sx={{
                        width: "100%",
                        justifyContent: "flex-start",
                        height: "auto",
                        minHeight: "36px",
                        padding: "8px 12px",
                        background: "white",
                        border: "1.5px solid #bae6fd",
                        "& .MuiChip-label": {
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#0c4a6e",
                          whiteSpace: "normal",
                          textAlign: "left",
                        },
                        "& .MuiChip-icon": {
                          color: "#0ea5e9",
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Fade>
            
            {/* Número e Complemento só aparecem após CEP encontrado */}
            {cepData && (
              <Grid container spacing={1.2}>
                <Grid item xs={12} sm={6}>
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={formData.complement ? "" : "Complemento (Opcional)"}
                    value={formData.complement}
                    onChange={(e) => handleChange("complement", e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: false }}
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1976d2", mb: 0 }}>
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
                  label={<Typography variant="body2" sx={{ fontSize: "13px" }}>Possui Blocos</Typography>}
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
                  label={<Typography variant="body2" sx={{ fontSize: "13px" }}>Medição Individual de Água</Typography>}
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
                  label={<Typography variant="body2" sx={{ fontSize: "13px" }}>Energia por Bloco</Typography>}
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
                  label={<Typography variant="body2" sx={{ fontSize: "13px" }}>Gás por Bloco</Typography>}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1976d2", mt: 0.5, mb: 0 }}>
              Rateio
            </Typography>
            <Grid container spacing={1.2}>
              <Grid item xs={12} sm={6}>
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={formData.allocationValuePerc > 0 ? "" : "Percentual de Rateio (%)"}
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

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1976d2", mt: 0.5, mb: 0 }}>
              Logotipo do Condomínio (opcional)
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
              sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 1.5, pt: 1.5, borderTop: "2px solid #f0f2f5" }}
            >
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{ 
                    minWidth: 100, 
                    height: 36,
                    textTransform: 'none',
                    fontSize: '13px',
                  }}
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
                  sx={{ 
                    minWidth: 100, 
                    height: 36,
                    textTransform: 'none',
                    fontSize: '13px',
                  }}
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
                  onClick={() => {
                    navigate("/dashboard");
                    setIsCadastroOpen(false);
                    setEditingId(null);
                    setActiveStep(0);
                  }}
                  sx={{
                    width: 40,
                    height: 40,
                    background: "white",
                    border: "2px solid #ef4444",
                    borderRadius: "10px",
                    color: "#ef4444",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      background: "rgba(239, 68, 68, 0.1)",
                      borderColor: "#dc2626",
                      color: "#dc2626",
                    },
                  }}
                >
                  <Close sx={{ fontSize: 20 }} />
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
                    .filter((condominium) =>
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
                      accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
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