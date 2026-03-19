import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  Badge,
  DirectionsCar,
  FitnessCenter,
  HowToReg,
  MarkunreadMailbox,
  Phone,
  Pool,
  Security,
  Villa,
} from "@mui/icons-material";
import StepWizardCard from "../../shared/components/StepWizardCard";
import { AppStateModal } from "../../shared/components/AppStateModal";
import { useAppStateModal } from "../../shared/utils/useAppStateModal";

interface ResidentContactOption {
  id: string;
  fullName: string;
  phone: string;
  intercom: string;
  atHome: boolean;
}

interface UnitSearchResult {
  id: string;
  label: string;
  residents: ResidentContactOption[];
}

interface VisitorFormData {
  organizationName: string;
  visitorName: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  email: string;
  visitorType: string;
  facePhoto: File | null;
  documentPhoto: File | null;
  destinationUnit: string;
  releaseType: "manual" | "resident" | "";
  selectedResidentId: string;
  areaAccess: Record<string, boolean>;
}

interface VisitorListItem {
  id: string;
  fullName: string;
  document: string;
  email: string;
  phone: string;
  visitorType: string;
  condominium: string;
  unit: string;
  lastVisit: string;
  releasedBy: string;
  imageUrl?: string;
  accentColor: string;
}

interface VisitanteFormProps {
  open: boolean;
  organizationName: string;
  loading: boolean;
  setLoading: (value: boolean) => void;
  onClose: () => void;
  onSaved: (visitor: VisitorListItem) => void | Promise<void>;
}

const stepLabels = [
  "Informações iniciais",
  "Identificação visual",
  "Destino da visita",
  "Tipo de liberação",
  "Controle de acesso",
];

const documentTypeOptions = [
  { value: "cpf", label: "CPF" },
  { value: "rg", label: "RG" },
  { value: "cnh", label: "CNH" },
  { value: "passaporte", label: "Passaporte" },
];

const visitorTypeOptions = [
  "Visitante Comum",
  "Prestador de Serviço",
  "Entregador",
  "Familiar",
];

const accessAreas = [
  { key: "piscina", label: "Piscina", icon: <Pool /> },
  { key: "academia", label: "Academia", icon: <FitnessCenter /> },
  { key: "salao_de_festas", label: "Salão de festas", icon: <Villa /> },
  { key: "garagem", label: "Garagem", icon: <DirectionsCar /> },
] as const;

const mockUnits: UnitSearchResult[] = [
  {
    id: "unit-101",
    label: "Apto 101",
    residents: [
      {
        id: "resident-1",
        fullName: "João Silva",
        phone: "(41) 99999-9999",
        intercom: "101",
        atHome: true,
      },
      {
        id: "resident-2",
        fullName: "Maria Souza",
        phone: "(41) 98888-8888",
        intercom: "101",
        atHome: false,
      },
    ],
  },
  {
    id: "unit-202",
    label: "Casa 12",
    residents: [
      {
        id: "resident-3",
        fullName: "Pedro Oliveira",
        phone: "(41) 97777-2222",
        intercom: "Casa 12",
        atHome: true,
      },
    ],
  },
];

const accentColors = ["#edf7f0", "#eef5ff", "#fcf0f6", "#fff3e0"];

const initialFormData = (organizationName: string): VisitorFormData => ({
  organizationName,
  visitorName: "",
  documentType: "",
  documentNumber: "",
  phone: "",
  email: "",
  visitorType: "",
  facePhoto: null,
  documentPhoto: null,
  destinationUnit: "",
  releaseType: "",
  selectedResidentId: "",
  areaAccess: {
    piscina: false,
    academia: false,
    salao_de_festas: false,
    garagem: false,
  },
});

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return digits.replace(/(\d{2})(\d+)/, "($1) $2");
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d+)/, "($1) $2-$3");
  }
  return digits.replace(/(\d{2})(\d{5})(\d+)/, "($1) $2-$3");
};

const formatDocument = (value: string, documentType: string) => {
  const digits = value.replace(/\D/g, "");
  if (documentType === "cpf") {
    const sliced = digits.slice(0, 11);
    if (sliced.length <= 3) return sliced;
    if (sliced.length <= 6) return sliced.replace(/(\d{3})(\d+)/, "$1.$2");
    if (sliced.length <= 9) {
      return sliced.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
    }
    return sliced.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, "$1.$2.$3-$4");
  }

  return value.slice(0, 20);
};

const getCurrentUserUnit = () => {
  const possibleKeys = ["unitCode", "unidade", "residentUnit", "unitLabel"];
  for (const key of possibleKeys) {
    const value = localStorage.getItem(key);
    if (value?.trim()) {
      return value.trim().toLowerCase();
    }
  }
  return "";
};

const FileUploadField = ({
  label,
  description,
  file,
  previewUrl,
  inputId,
  onChange,
}: {
  label: string;
  description: string;
  file: File | null;
  previewUrl: string | null;
  inputId: string;
  onChange: (file: File | null) => void;
}) => (
  <Box className="visitante-upload-card">
    <Typography className="visitante-section-title">{label}</Typography>
    <Box className="visitante-upload-box">
      <input
        id={inputId}
        hidden
        type="file"
        accept="image/*"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
      <label htmlFor={inputId} className="visitante-upload-trigger">
        {previewUrl ? (
          <Box className="visitante-upload-preview-wrapper">
            <Box
              component="img"
              src={previewUrl}
              alt={`Preview de ${label.toLowerCase()}`}
              className="visitante-upload-preview"
            />
          </Box>
        ) : (
          <>
            <Box className="visitante-upload-icon">
              <Badge />
            </Box>
            <Typography className="visitante-upload-label">
              {file ? file.name : `Adicionar ${label.toLowerCase()}`}
            </Typography>
            <Typography className="visitante-upload-description">
              {description}
            </Typography>
          </>
        )}
      </label>
    </Box>
  </Box>
);

const VisitanteForm: React.FC<VisitanteFormProps> = ({
  open,
  organizationName,
  loading,
  setLoading,
  onClose,
  onSaved,
}) => {
  const { appStateModal, handleClose, showSuccess, showError } =
    useAppStateModal();
  const [closeAfterModal, setCloseAfterModal] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<VisitorFormData>(
    initialFormData(organizationName),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [unitSearchResult, setUnitSearchResult] =
    useState<UnitSearchResult | null>(null);
  const [unitSearched, setUnitSearched] = useState(false);
  const [facePhotoPreview, setFacePhotoPreview] = useState<string | null>(null);
  const [documentPhotoPreview, setDocumentPhotoPreview] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;
    setActiveStep(0);
    setErrors({});
    setUnitSearchResult(null);
    setUnitSearched(false);
    setFacePhotoPreview(null);
    setDocumentPhotoPreview(null);
    setFormData(initialFormData(organizationName));
  }, [open, organizationName]);

  useEffect(() => {
    if (!formData.facePhoto) {
      setFacePhotoPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(formData.facePhoto);
    setFacePhotoPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [formData.facePhoto]);

  useEffect(() => {
    if (!formData.documentPhoto) {
      setDocumentPhotoPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(formData.documentPhoto);
    setDocumentPhotoPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [formData.documentPhoto]);

  const currentUserUnit = useMemo(() => getCurrentUserUnit(), []);

  const residentCanManageAccess = Boolean(
    unitSearchResult && unitSearchResult.label.toLowerCase() === currentUserUnit,
  );

  const selectedResident = unitSearchResult?.residents.find(
    (resident) => resident.id === formData.selectedResidentId,
  );

  if (!open) return null;

  const clearFieldError = (field: string) => {
    if (!errors[field]) return;
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleChange = (field: keyof VisitorFormData, value: unknown) => {
    let processedValue = value;
    if (field === "phone") {
      processedValue = formatPhone(String(value));
    }
    if (field === "documentNumber") {
      processedValue = formatDocument(
        String(value),
        String(formData.documentType || ""),
      );
    }

    setFormData((current) => ({
      ...current,
      [field]: processedValue,
    }));
    clearFieldError(field);
  };

  const handleAreaToggle = (key: string, checked: boolean) => {
    setFormData((current) => ({
      ...current,
      areaAccess: {
        ...current.areaAccess,
        [key]: checked,
      },
    }));
  };

  const validateStep = (step: number) => {
    const nextErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.visitorName.trim()) {
        nextErrors.visitorName = "Informe o nome do visitante.";
      }
      if (!formData.documentType) {
        nextErrors.documentType = "Selecione o tipo de documento.";
      }
      if (!formData.documentNumber.trim()) {
        nextErrors.documentNumber = "Informe o documento.";
      }
      if (formData.documentType === "cpf") {
        const digits = formData.documentNumber.replace(/\D/g, "");
        if (digits.length !== 11) {
          nextErrors.documentNumber = "CPF inválido.";
        }
      }
      if (!formData.phone.trim()) {
        nextErrors.phone = "Informe o telefone.";
      }
      if (!formData.email.trim()) {
        nextErrors.email = "Informe o email.";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        nextErrors.email = "Email inválido.";
      }
    }

    if (step === 1) {
      if (!formData.visitorType) {
        nextErrors.visitorType = "Selecione o tipo de visitante.";
      }
      if (!formData.facePhoto) {
        nextErrors.facePhoto = "Adicione a foto do rosto.";
      }
      if (!formData.documentPhoto) {
        nextErrors.documentPhoto = "Adicione a foto do documento.";
      }
    }

    if (step === 2) {
      if (!formData.destinationUnit.trim()) {
        nextErrors.destinationUnit = "Informe a unidade de destino.";
      }
      if (!unitSearchResult) {
        nextErrors.destinationUnit = "Pesquise e selecione uma unidade válida.";
      } else if (!formData.selectedResidentId) {
        nextErrors.selectedResidentId =
          "Selecione com quem o visitante vai falar.";
      }
    }

    if (step === 3) {
      if (!formData.releaseType) {
        nextErrors.releaseType = "Selecione o tipo de liberação.";
      }
      if (formData.releaseType === "resident" && !residentCanManageAccess) {
        nextErrors.releaseType =
          "Liberação direta só pode ser feita por morador da unidade.";
      }
    }

    return nextErrors;
  };

  void validateStep;

  const handleNext = () => {
    setActiveStep((current) => current + 1);
  };

  const handleSearchUnit = async () => {
    const query = formData.destinationUnit.trim().toLowerCase();

    setLoading(true);
    try {
      // TODO: substituir por endpoint de busca de unidade e moradores.
      const foundUnit =
        mockUnits.find((unit) => unit.label.toLowerCase() === query) || null;

      setUnitSearchResult(foundUnit);
      setUnitSearched(true);
      setFormData((current) => ({
        ...current,
        selectedResidentId: "",
        releaseType: "",
      }));

      if (!foundUnit) {
        showError(
          "Nenhuma unidade encontrada com esse identificador.",
          "Quando o endpoint estiver liberado, conecte a busca aqui.",
        );
      } else {
        clearFieldError("destinationUnit");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResidentLookup = () => {
    // TODO: integrar com a tela/endpoint de pesquisa de morador.
    showSuccess(
      "Gatilho de pesquisa de morador preparado.",
      "Conecte aqui a navegação para localizar o morador e retornar para esta etapa.",
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const visitor: VisitorListItem = {
        id: `visitor-${Date.now()}`,
        fullName: formData.visitorName.trim(),
        document: formData.documentNumber.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        visitorType: formData.visitorType,
        condominium: organizationName,
        unit: unitSearchResult?.label || formData.destinationUnit.trim(),
        lastVisit: new Date().toLocaleString("pt-BR"),
        releasedBy:
          formData.releaseType === "resident" && selectedResident
            ? selectedResident.fullName
            : "Portaria Manual",
        imageUrl: formData.facePhoto
          ? URL.createObjectURL(formData.facePhoto)
          : undefined,
        accentColor:
          accentColors[Math.floor(Math.random() * accentColors.length)],
      };

      await onSaved(visitor);
      setCloseAfterModal(true);
      showSuccess("Visitante cadastrado com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao cadastrar visitante.";
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = async () => {
    handleClose();
    if (closeAfterModal) {
      setCloseAfterModal(false);
      onClose();
    }
  };

  const renderStepContent = (step: number) => {
    if (step === 0) {
      return (
        <Box className="visitante-form-grid">
          <TextField
            fullWidth
            label={formData.organizationName ? "" : "Organização"}
            value={formData.organizationName}
            disabled
            InputProps={{ readOnly: true }}
          />
          <TextField
            fullWidth
            label={formData.visitorName ? "" : "Nome do Visitante"}
            placeholder="Digite o nome completo"
            value={formData.visitorName}
            onChange={(event) =>
              handleChange("visitorName", event.target.value)
            }
            error={Boolean(errors.visitorName)}
            helperText={errors.visitorName}
          />
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label={formData.documentType ? "" : "Tipo de documento"}
                value={formData.documentType}
                onChange={(event) => {
                  handleChange("documentType", event.target.value);
                  setFormData((current) => ({
                    ...current,
                    documentNumber: "",
                  }));
                }}
                error={Boolean(errors.documentType)}
                helperText={errors.documentType}
              >
                <MenuItem value="" disabled>
                  Selecione
                </MenuItem>
                {documentTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={formData.documentNumber ? "" : "Documento"}
                value={formData.documentNumber}
                onChange={(event) =>
                  handleChange("documentNumber", event.target.value)
                }
                error={Boolean(errors.documentNumber)}
                helperText={errors.documentNumber}
              />
            </Grid>
          </Grid>
          <TextField
            fullWidth
            label={formData.phone ? "" : "Telefone"}
            placeholder="(00) 00000-0000"
            value={formData.phone}
            onChange={(event) => handleChange("phone", event.target.value)}
            error={Boolean(errors.phone)}
            helperText={errors.phone}
          />
          <TextField
            fullWidth
            label={formData.email ? "" : "Email"}
            placeholder="email@exemplo.com"
            value={formData.email}
            onChange={(event) => handleChange("email", event.target.value)}
            error={Boolean(errors.email)}
            helperText={errors.email}
          />
          <Typography className="visitante-step-help">
            Preencha os dados básicos para seguir para as próximas etapas.
          </Typography>
        </Box>
      );
    }

    if (step === 1) {
      return (
        <Box className="visitante-form-grid">
          <TextField
            fullWidth
            select
            label={formData.visitorType ? "" : "Tipo de Visitante"}
            value={formData.visitorType}
            onChange={(event) => handleChange("visitorType", event.target.value)}
            error={Boolean(errors.visitorType)}
            helperText={errors.visitorType}
          >
            <MenuItem value="" disabled>
              Selecione
            </MenuItem>
            {visitorTypeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>

          <FileUploadField
            label="Foto do rosto"
            description="Toque para capturar ou enviar uma imagem"
            file={formData.facePhoto}
            previewUrl={facePhotoPreview}
            inputId="visitante-face-photo"
            onChange={(file) => {
              setFormData((current) => ({ ...current, facePhoto: file }));
              clearFieldError("facePhoto");
            }}
          />
          {errors.facePhoto ? (
            <Typography className="visitante-error-text">
              {errors.facePhoto}
            </Typography>
          ) : null}

          <FileUploadField
            label="Foto do documento"
            description="Envie a frente ou imagem principal do documento"
            file={formData.documentPhoto}
            previewUrl={documentPhotoPreview}
            inputId="visitante-document-photo"
            onChange={(file) => {
              setFormData((current) => ({ ...current, documentPhoto: file }));
              clearFieldError("documentPhoto");
            }}
          />
          {errors.documentPhoto ? (
            <Typography className="visitante-error-text">
              {errors.documentPhoto}
            </Typography>
          ) : null}
        </Box>
      );
    }

    if (step === 2) {
      return (
        <Box className="visitante-form-grid">
          <Typography className="visitante-section-title">
            Unidade destino
          </Typography>
          <Box className="visitante-search-row">
            <TextField
              fullWidth
              placeholder="Apto 101"
              value={formData.destinationUnit}
              onChange={(event) =>
                handleChange("destinationUnit", event.target.value)
              }
              error={Boolean(errors.destinationUnit)}
              helperText={errors.destinationUnit}
            />
            <Button
              variant="contained"
              onClick={handleSearchUnit}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : "Buscar"}
            </Button>
          </Box>

          <Typography className="visitante-step-help">
            Digite a unidade e faça a busca para localizar os moradores.
          </Typography>

          {unitSearchResult ? (
            <Box className="visitante-residents-list">
              <Typography className="visitante-section-title">
                Moradores encontrados
              </Typography>
              {unitSearchResult.residents.map((resident) => (
                <Box className="visitante-resident-card" key={resident.id}>
                  <Box className="visitante-resident-main">
                    <Box>
                      <Typography className="visitante-resident-name">
                        {resident.fullName}
                      </Typography>
                      <Box className="visitante-resident-line">
                        <Phone sx={{ fontSize: 16 }} />
                        <Typography>{resident.phone}</Typography>
                      </Box>
                      <Box className="visitante-resident-line">
                        <MarkunreadMailbox sx={{ fontSize: 16 }} />
                        <Typography>Interfone {resident.intercom}</Typography>
                      </Box>
                    </Box>
                    <Checkbox
                      checked={formData.selectedResidentId === resident.id}
                      onChange={() =>
                        setFormData((current) => ({
                          ...current,
                          selectedResidentId:
                            current.selectedResidentId === resident.id
                              ? ""
                              : resident.id,
                        }))
                      }
                    />
                  </Box>
                  <Chip
                    label={resident.atHome ? "Tem gente em casa" : "Ninguém em casa"}
                    color={resident.atHome ? "success" : "error"}
                    variant="outlined"
                    size="small"
                    className="visitante-chip"
                  />
                </Box>
              ))}
              {errors.selectedResidentId ? (
                <Typography className="visitante-error-text">
                  {errors.selectedResidentId}
                </Typography>
              ) : null}
            </Box>
          ) : null}

          {unitSearched && !unitSearchResult ? (
            <Alert severity="warning" className="visitante-alert">
              Unidade não encontrada. Use a pesquisa de morador para identificar o
              contato e depois retorne para este passo.
            </Alert>
          ) : null}

          {!unitSearchResult ? (
            <Box className="visitante-resident-fallback">
              <Button variant="outlined" onClick={handleResidentLookup}>
                Pesquisar Morador
              </Button>
            </Box>
          ) : null}
        </Box>
      );
    }

    if (step === 3) {
      return (
        <Box className="visitante-form-grid">
          <Typography className="visitante-section-title">
            Tipo de Liberação
          </Typography>
          <Box className="visitante-option-list">
            <Box
              className={`visitante-option-card ${
                formData.releaseType === "manual" ? "selected" : ""
              }`}
              onClick={() =>
                setFormData((current) => ({ ...current, releaseType: "manual" }))
              }
            >
              <Box className="visitante-option-icon manual">
                <Security />
              </Box>
              <Box className="visitante-option-copy">
                <Typography className="visitante-option-title">
                  Manual Portaria
                </Typography>
                <Typography className="visitante-option-description">
                  Liberação feita manualmente pela equipe da portaria.
                </Typography>
              </Box>
            </Box>

            <Box
              className={`visitante-option-card ${
                formData.releaseType === "resident" ? "selected" : "disabled"
              }`}
              onClick={() => {
                setFormData((current) => ({
                  ...current,
                  releaseType: "resident",
                }));
                clearFieldError("releaseType");
              }}
            >
              <Box className="visitante-option-icon resident">
                <HowToReg />
              </Box>
              <Box className="visitante-option-copy">
                <Typography className="visitante-option-title">
                  Direto pelo Morador
                </Typography>
                <Typography className="visitante-option-description">
                  Disponível apenas quando o usuário logado pertence à unidade
                  selecionada.
                </Typography>
              </Box>
            </Box>
          </Box>

          {errors.releaseType ? (
            <Typography className="visitante-error-text">
              {errors.releaseType}
            </Typography>
          ) : null}

          <Alert severity={residentCanManageAccess ? "success" : "info"}>
            {residentCanManageAccess
              ? "Usuário logado identificado como morador da unidade. A liberação direta está habilitada."
              : "Liberação direta pelo morador fica bloqueada até validar que o usuário logado pertence à unidade."}
          </Alert>
        </Box>
      );
    }

    return (
      <Box className="visitante-form-grid">
        <Typography className="visitante-section-title">
          Controle de acesso por área
        </Typography>

        <Box className="visitante-access-list">
          {accessAreas.map((area) => (
            <Box className="visitante-access-card" key={area.key}>
              <Box className="visitante-access-copy">
                <Box className="visitante-option-icon area">
                  {area.icon}
                </Box>
                <Typography className="visitante-option-title">
                  {area.label}
                </Typography>
              </Box>
              <Switch
                checked={Boolean(formData.areaAccess[area.key])}
                onChange={(event) =>
                  handleAreaToggle(area.key, event.target.checked)
                }
              />
            </Box>
          ))}
        </Box>

        <Alert severity={residentCanManageAccess ? "success" : "warning"}>
          {residentCanManageAccess
            ? "Os acessos estão liberados para edição pelo morador da unidade."
            : "Somente o morador da unidade pode alterar estes acessos. Os itens permanecem visíveis e aguardam integração com endpoint."}
        </Alert>
      </Box>
    );
  };

  return (
    <>
      <StepWizardCard
        title="Registrar Visitante"
        subtitle={stepLabels[activeStep]}
        steps={stepLabels}
        activeStep={activeStep}
        showBack
        onBack={() => {
          if (activeStep === 0) {
            onClose();
            return;
          }
          setActiveStep((current) => current - 1);
        }}
        onClose={onClose}
        width={activeStep >= 2 ? "780px" : "650px"}
        disableContent={loading}
        actions={
          activeStep === stepLabels.length - 1 ? (
            <Button variant="contained" onClick={handleSubmit} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : "Concluir"}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : "Avançar"}
            </Button>
          )
        }
      >
        {renderStepContent(activeStep)}
      </StepWizardCard>

      <AppStateModal
        open={appStateModal.open}
        type={appStateModal.type}
        title={appStateModal.title}
        message={appStateModal.message}
        detail={appStateModal.detail}
        item={appStateModal.item}
        onConfirm={handleModalClose}
        onClose={handleModalClose}
        showCancel={false}
      />
    </>
  );
};

export default VisitanteForm;
