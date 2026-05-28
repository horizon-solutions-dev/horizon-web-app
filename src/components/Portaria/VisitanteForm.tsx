import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Grid,
  Grid2,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import {
  BadgeOutlined,
  DirectionsCar,
  FitnessCenter,
  HowToReg,
  Pool,
  Security,
  Celebration,
  PersonOutline,
  SearchOutlined,
  People,
} from "@mui/icons-material";
import StepWizardCard from "../../shared/components/StepWizardCard";
import ImageUploadField from "../../shared/components/ImageUploadField";
import { AppStateModal } from "../../shared/components/AppStateModal";
import { useAppStateModal } from "../../shared/utils/useAppStateModal";
import { unitResidentService } from "../../services/unitResidentService";
import { unitService, type CondominiumUnit } from "../../services/unitService";
import { visitorService } from "../../services/visitorService";
import { areaService } from "../../services/areaService";
import type { AreaResponse } from "../../models/area.model";
import type { VisitorEnum } from "../../models/visitor.model";
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
  destinationBlock: string;
  destinationUnit: string;
  visitorReasonId: string;
  notes: string;
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
  visitStart: string;
  visitEnd: string;
  finished: boolean;
  releasedBy: string;
  activeVisitId?: string;
  imageUrl?: string;
  accentColor: string;
}

export interface ExistingVisitorFormData {
  id: string;
  fullName: string;
  documentType?: number | string;
  document: string;
  email: string;
  phone: string;
  visitorType?: number | string;
  visitorReasonId?: number | string;
  notes?: string;
  facePhotoUrl?: string;
  documentPhotoUrl?: string;
}

interface VisitanteFormProps {
  open: boolean;
  organizationName: string;
  condominiumId: string;
  loading: boolean;
  setLoading: (value: boolean) => void;
  onClose: () => void;
  onSaved: (visitor:  any ) => Promise<void> | Promise<void>;
  existingVisitor?: ExistingVisitorFormData | null;
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

const accentColors = ["#edf7f0", "#eef5ff", "#fcf0f6", "#fff3e0"];

const initialFormData = (organizationName: string): VisitorFormData => ({
  organizationName,
  visitorName: "",
  documentType: "cpf",
  documentNumber: "",
  phone: "",
  email: "",
  visitorType: "",
  facePhoto: null,
  documentPhoto: null,
  destinationBlock: "",
  destinationUnit: "",
  visitorReasonId: "",
  notes: "",
  releaseType: "",
  selectedResidentId: "",
  areaAccess: {},
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

const validateCpf = (cpf: string) => {
  const cpfClean = cpf.replace(/\D/g, "");

  if (cpfClean.length !== 11 || /^(\d)\1+$/.test(cpfClean)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += parseInt(cpfClean.charAt(i), 10) * (10 - i);
  }

  let result = (sum * 10) % 11;
  if (result === 10) result = 0;
  if (result !== parseInt(cpfClean.charAt(9), 10)) {
    return false;
  }

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += parseInt(cpfClean.charAt(i), 10) * (11 - i);
  }

  result = (sum * 10) % 11;
  if (result === 10) result = 0;
  return result === parseInt(cpfClean.charAt(10), 10);
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

const getDocumentTypeValue = (documentType: string) => {
  const option = documentTypeOptions.find((item) => item.value === documentType);
  return option ? documentTypeOptions.indexOf(option) + 1 : "";
};

const normalizeDocumentType = (documentType?: number | string) => {
  if (documentType === undefined || documentType === null || documentType === "") {
    return "cpf";
  }

  const value = String(documentType).trim().toLowerCase();
  const byValue = documentTypeOptions.find((item) => item.value === value);
  if (byValue) return byValue.value;

  const numericIndex = Number(value);
  if (!Number.isNaN(numericIndex) && documentTypeOptions[numericIndex - 1]) {
    return documentTypeOptions[numericIndex - 1].value;
  }

  return "cpf";
};

const dataUrlToFile = (dataUrl: string, fileName: string) => {
  const [metadata, content] = dataUrl.split(",");
  const mimeMatch = metadata.match(/data:(.*?);base64/);
  const contentType = mimeMatch?.[1] || "image/png";
  const binary = atob(content || "");
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: contentType });
};

const getEnumOptionLabel = (option: VisitorEnum | string) => {
  if (typeof option === "string") return option;
  return option.description || option.value || String(option.id);
};

const getEnumOptionValue = (option: VisitorEnum | string) => {
  if (typeof option === "string") return option;
  return String(option.id || option.value);
};

const getAreaIcon = (area: AreaResponse) => {
  const text = `${area.name} ${area.type}`.toLowerCase();
  if (text.includes("pisc")) return <Pool />;
  if (text.includes("academ") || text.includes("fitness")) return <FitnessCenter />;
  if (text.includes("festa") || text.includes("salao") || text.includes("salÃ£o")) return <Celebration />;
  if (text.includes("garag") || text.includes("estacion")) return <DirectionsCar />;
  return <Security />;
};

const getRequestValidationMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | {
        validations?: Array<{ field?: string; message?: string }>;
        friendlyMessage?: string;
        message?: string;
      }
      | undefined;
    const firstValidation = data?.validations?.find(
      (validation) => validation.message?.trim(),
    );

    return (
      firstValidation?.message ||
      data?.friendlyMessage ||
      data?.message ||
      error.message ||
      fallback
    );
  }

  return error instanceof Error ? error.message : fallback;
};

const mapUnitResult = async (unit: CondominiumUnit): Promise<UnitSearchResult> => {
  let residentsResponse;

  try {
    residentsResponse = await unitResidentService.getResidents(
      unit.condominiumUnitId,
      1,
      50,
    );
  } catch {
    residentsResponse = { items: [] };
  }

  return {
    id: unit.condominiumUnitId,
    label: unit.unitCode || unit.condominiumUnitId,
    residents: (residentsResponse.items ?? []).map((resident) => ({
      id: resident.condominiumUnitResidentId,
      fullName: resident.fullname || resident.email || resident.userId,
      phone: resident.phone || "-",
      intercom: unit.unitCode || "-",
      atHome: true,
    })),
  };
};

const VisitanteForm: React.FC<VisitanteFormProps> = ({
  open,
  organizationName,
  condominiumId,
  loading,
  setLoading,
  onClose,
  onSaved,
  existingVisitor = null,
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
  const [unitSearchResults, setUnitSearchResults] = useState<UnitSearchResult[]>(
    [],
  );
  const [availableUnits, setAvailableUnits] = useState<CondominiumUnit[]>([]);
  const [destinationQuery, setDestinationQuery] = useState("");
  const [unitSearched, setUnitSearched] = useState(false);
  const [areas, setAreas] = useState<AreaResponse[]>([]);
  const [destinationLoading, setDestinationLoading] = useState(false);
  const [visitorTypes, setVisitorTypes] = useState<VisitorEnum[]>([]);
  const [visitorReasons, setVisitorReasons] = useState<VisitorEnum[]>([]);
  const [facePhotoPreview, setFacePhotoPreview] = useState<string | null>(null);
  const [documentPhotoPreview, setDocumentPhotoPreview] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;
    setActiveStep(0);
    setErrors({});
    setUnitSearchResult(null);
    setUnitSearchResults([]);
    setDestinationQuery("");
    setUnitSearched(false);
    setAreas([]);
    setFacePhotoPreview(existingVisitor?.facePhotoUrl || null);
    setDocumentPhotoPreview(existingVisitor?.documentPhotoUrl || null);
    setFormData({
      ...initialFormData(organizationName),
      visitorName: existingVisitor?.fullName || "",
      documentType: normalizeDocumentType(existingVisitor?.documentType),
      documentNumber: existingVisitor?.document || "",
      phone: existingVisitor?.phone || "",
      email: existingVisitor?.email || "",
      visitorType: existingVisitor?.visitorType ? String(existingVisitor.visitorType) : "",
      visitorReasonId: existingVisitor?.visitorReasonId
        ? String(existingVisitor.visitorReasonId)
        : "",
      notes: existingVisitor?.notes || "",
    });
  }, [open, organizationName, existingVisitor]);

  useEffect(() => {
    if (!open || !condominiumId) return;

    const loadCondominiumData = async () => {
      try {
        const [areasResponse, unitsResponse] = await Promise.all([
          areaService.getAreas(condominiumId, 1, 100),
          unitService.getUnitsByCondominium(condominiumId, 1, 100),
        ]);
        const loadedAreas = areasResponse.items ?? [];
        setAreas(loadedAreas);
        setAvailableUnits(unitsResponse.items ?? []);
        setFormData((current) => ({
          ...current,
          areaAccess: loadedAreas.reduce<Record<string, boolean>>(
            (acc, area) => ({
              ...acc,
              [area.areaId]: Boolean(current.areaAccess[area.areaId]),
            }),
            {},
          ),
        }));
      } catch {
        setAreas([]);
        setAvailableUnits([]);
      }
    };

    void loadCondominiumData();
  }, [open, condominiumId]);

  useEffect(() => {
    if (!open) return;

    const loadEnums = async () => {
      try {
        const [types, reasons] = await Promise.all([
          visitorService.getVisitorTypes(),
          visitorService.getVisitorReasons(),
        ]);
        setVisitorTypes(types ?? []);
        setVisitorReasons(reasons ?? []);
        /*        setFormData((current) => ({
                 ...current,
                 visitorReasonId: current.visitorReasonId || String(reasons?.[0]?.value ?? reasons?.[0]?.id ?? ""),
               })); */
      } catch {
        setVisitorTypes([]);
        setVisitorReasons([]);
      }
    };

    void loadEnums();
  }, [open]);

  useEffect(() => {
    if (!formData.facePhoto) {
      if (!existingVisitor?.facePhotoUrl) setFacePhotoPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(formData.facePhoto);
    setFacePhotoPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [formData.facePhoto]);

  useEffect(() => {
    if (!formData.documentPhoto) {
      if (!existingVisitor?.documentPhotoUrl) setDocumentPhotoPreview(null);
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
        if (!validateCpf(formData.documentNumber)) {
          nextErrors.documentNumber = "CPF inválido";
        }
      }
      if (!formData.phone.trim()) {
        nextErrors.phone = "Informe o telefone.";
      }
      if (!formData.email.trim()) {
        nextErrors.email = "Informe o email.";
      } else if (
        !/^[^\s@]+@(?:[^\s@.]+\.)+[^\s@.]{2,}$/.test(formData.email.trim())
      ) {
        nextErrors.email = "Informe um e-mail válido";
      }
    }

    if (step === 1) {
      if (!formData.visitorType) {
        nextErrors.visitorType = "Selecione o tipo de visitante.";
      }
      if (!formData.facePhoto && !facePhotoPreview) {
        nextErrors.facePhoto = "Adicione a foto do rosto.";
      }
      if (!formData.documentPhoto && !documentPhotoPreview) {
        nextErrors.documentPhoto = "Adicione a foto do documento.";
      }
    }

    if (step === 2) {
      if (!destinationQuery.trim() && !unitSearchResult) {
        nextErrors.destinationUnit = "Digite a unidade e faça a busca.";
      } else if (!unitSearchResult || !formData.selectedResidentId) {
        nextErrors.selectedResidentId =
          "Selecione com quem o visitante vai falar.";
      }
    }

    if (step === 3) {
      if (!formData.visitorReasonId) {
        nextErrors.visitorReasonId = "Selecione o motivo da visita.";
      }
      if (!formData.notes.trim()) {
        nextErrors.notes = "Observações obrigatórias.";
      }
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

  const handleNext = () => {
    const nextErrors = validateStep(activeStep);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setActiveStep((current) => current + 1);
  };

  const handleDestinationSearch = async () => {
    const query = destinationQuery.trim().toLowerCase();

    setUnitSearched(true);
    setUnitSearchResult(null);
    setUnitSearchResults([]);
    setFormData((current) => ({
      ...current,
      destinationUnit: "",
      destinationBlock: "",
      selectedResidentId: "",
      releaseType: "",
    }));
    clearFieldError("destinationUnit");
    clearFieldError("selectedResidentId");

    if (!query) {
      setErrors((current) => ({
        ...current,
        destinationUnit: "Digite a unidade e faça a busca.",
      }));
      return;
    }

    setDestinationLoading(true);
    try {
      let selectedUnit = availableUnits.find(
        (unit) =>
          unit.condominiumId === condominiumId &&
          [unit.unitCode, unit.condominiumUnitId]
            .filter(Boolean)
            .some((value) => String(value).trim().toLowerCase() === query),
      );

      if (!selectedUnit) {
        const unitsResponse = await unitService.getUnitsByCondominium(
          condominiumId,
          1,
          500,
        );
        const loadedUnits = unitsResponse.items ?? [];
        setAvailableUnits(loadedUnits);
        selectedUnit = loadedUnits.find((unit) =>
          [unit.unitCode, unit.condominiumUnitId]
            .filter(Boolean)
            .some((value) => String(value).trim().toLowerCase() === query),
        );
      }

      if (!selectedUnit) {
        setErrors((current) => ({
          ...current,
          destinationUnit: "Unidade não encontrada neste condomínio.",
        }));
        return;
      }

      const mappedUnit = await mapUnitResult(selectedUnit);
      setFormData((current) => ({
        ...current,
        destinationUnit: selectedUnit.condominiumUnitId,
        destinationBlock: selectedUnit.condominiumBlockId || "",
      }));
      setDestinationQuery(
        selectedUnit.unitCode || selectedUnit.condominiumUnitId || "",
      );
      if (mappedUnit.residents.length === 0) {
        setErrors((current) => ({
          ...current,
          selectedResidentId: "Nenhum morador encontrado para esta unidade.",
        }));
        return;
      }
      setUnitSearchResults([mappedUnit]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar moradores.";
      setErrors((current) => ({
        ...current,
        selectedResidentId: message,
      }));
    } finally {
      setDestinationLoading(false);
    }
  };

  const handleResidentSelect = (
    unit: UnitSearchResult,
    resident: ResidentContactOption,
  ) => {
    setUnitSearchResult(unit);
    setFormData((current) => ({
      ...current,
      destinationUnit: unit.id,
      selectedResidentId: resident.id,
      releaseType: "",
    }));
    clearFieldError("destinationUnit");
    clearFieldError("selectedResidentId");
  };

  const handleSubmit = async () => {
    const nextErrors = validateStep(activeStep);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const facePhoto =
      formData.facePhoto ||
      (facePhotoPreview ? dataUrlToFile(facePhotoPreview, "face-photo.png") : null);
    const documentPhoto =
      formData.documentPhoto ||
      (documentPhotoPreview
        ? dataUrlToFile(documentPhotoPreview, "document-photo.png")
        : null);

    if (!facePhoto || !documentPhoto || !unitSearchResult) return;

    setLoading(true);
    try {
      const visitorId =
        (await visitorService.createVisitor({
          name: formData.visitorName.trim(),
          documentType: getDocumentTypeValue(formData.documentType),
          documentNumber: formData.documentNumber.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          visitorTypeId: formData.visitorType,
          facePhoto,
          documentPhoto,
          commit: true,
        }));

      const previousVisitorId = existingVisitor?.id || visitorId;
      const visitResponse = await visitorService.createVisit({
        entryAt: new Date().toISOString(),
        releasedByResident: formData.releaseType === "resident",
        typeVisitorReasonId: formData.visitorReasonId,
        notes: formData.notes.trim(),
        visitorId,
        previousVisitorId,
        condominiumId,
        condominiumUnitId: unitSearchResult.id,
        condominiumUnitResidentId: formData.selectedResidentId,
        visitorAccessPermissions: Object.entries(formData.areaAccess).map(
          ([areaId, active]) => ({
            areaId,
            active,
          }),
        ),
        commit: true,
      });

      const visitor: VisitorListItem = {
        id: visitorId,
        fullName: formData.visitorName.trim(),
        document: formData.documentNumber.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        visitorType: formData.visitorType,
        condominium: organizationName,
        unit: unitSearchResult?.label || formData.destinationUnit.trim(),
        lastVisit: new Date().toLocaleString("pt-BR"),
        visitStart: new Date().toLocaleString("pt-BR"),
        visitEnd: "-",
        finished: false,
        releasedBy:
          formData.releaseType === "resident" && selectedResident
            ? selectedResident.fullName
            : "Portaria Manual",
        activeVisitId: visitResponse.visitorHistoryId,
        imageUrl: formData.facePhoto
          ? URL.createObjectURL(formData.facePhoto)
          : facePhotoPreview || undefined,
        accentColor:
          accentColors[Math.floor(Math.random() * accentColors.length)],
      };

      await onSaved(visitor);
      setCloseAfterModal(true);
      showSuccess(existingVisitor ? "Visita registrada com sucesso." : "Visitante cadastrado com sucesso.");
    } catch (error) {
      showError(getRequestValidationMessage(error, "Erro ao cadastrar visitante."));
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

  const getVisitorWizardWidth = () => {
    const widths = [
      "min(680px, calc(100vw - 32px))",
      "min(760px, calc(100vw - 32px))",
      "min(640px, calc(100vw - 32px))",
      "min(620px, calc(100vw - 32px))",
      "min(620px, calc(100vw - 32px))",
    ];

    return widths[activeStep] || widths[0];
  };

  const visitorCardClassName = [
    "visitor-form-step",
    activeStep === 3 ? "visitor-release-step" : "",
    activeStep === stepLabels.length - 1 ? "visitor-access-card-step" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const renderStepContent = (step: number) => {
    if (step === 0) {
      return (
        <Box className="visitante-form-grid">
          <TextField
            fullWidth
            placeholder="Organização"
            value={formData.organizationName}
            disabled
            InputProps={{ readOnly: true }}
          />
          <TextField
            fullWidth
            placeholder="Digite o nome completo"
            value={formData.visitorName}
            disabled={Boolean(existingVisitor)}
            InputProps={existingVisitor ? { readOnly: true } : undefined}
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
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 48,
                  },
                }}
                label={formData.documentType ? "" : "Tipo de documento"}
                value={formData.documentType}
                disabled={Boolean(existingVisitor)}
                InputProps={existingVisitor ? { readOnly: true } : undefined}
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
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 48,
                  },
                }}
                placeholder="Documento"
                value={formData.documentNumber}
                disabled={Boolean(existingVisitor)}
                InputProps={existingVisitor ? { readOnly: true } : undefined}
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
            placeholder="(00) 00000-0000"
            value={formData.phone}
            onChange={(event) => handleChange("phone", event.target.value)}
            error={Boolean(errors.phone)}
            helperText={errors.phone}
          />
          <TextField
            fullWidth
            placeholder="email@exemplo.com"
            value={formData.email}
            onChange={(event) => handleChange("email", event.target.value)}
            error={Boolean(errors.email)}
            helperText={errors.email}
          />
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
            {(visitorTypes.length > 0 ? visitorTypes : visitorTypeOptions).map((option) => (
              <MenuItem key={getEnumOptionValue(option)} value={getEnumOptionValue(option)}>
                {getEnumOptionLabel(option)}
              </MenuItem>
            ))}
          </TextField>
          <Grid2 container justifyContent={'space-around'}>
            <Grid item xs={12} md={4}>
              <ImageUploadField
                sx={{ maxWidth: '333px' }}
                height={140}
                label={`Foto do rosto`}
                icon={<PersonOutline />}
                showIcon
                description="Toque para capturar ou enviar uma imagem. JPG ou PNG ate 5MB."
                fileName={formData.facePhoto?.name}
                previewUrl={facePhotoPreview}
                onChange={(file) => {
                  setFormData((current) => ({ ...current, facePhoto: file }));
                  if (!file) setFacePhotoPreview(null);
                  clearFieldError("facePhoto");
                }}
              />
              {errors.facePhoto ? (
                <Typography className="visitante-error-text">
                  {errors.facePhoto}
                </Typography>
              ) : null}
            </Grid>
            <Grid item xs={12} md={4}>

              <ImageUploadField
                sx={{ maxWidth: '333px' }}
                height={140}
                label="Foto do documento"
                icon={<BadgeOutlined />}
                showIcon
                description="Envie a frente ou imagem principal do documento. JPG ou PNG ate 5MB."
                fileName={formData.documentPhoto?.name}
                previewUrl={documentPhotoPreview}
                onChange={(file) => {
                  setFormData((current) => ({ ...current, documentPhoto: file }));
                  if (!file) setDocumentPhotoPreview(null);
                  clearFieldError("documentPhoto");
                }}
              />
              {errors.documentPhoto ? (
                <Typography className="visitante-error-text">
                  {errors.documentPhoto}
                </Typography>
              ) : null}
            </Grid>
          </Grid2>
        </Box>
      );
    }

    if (step === 2) {
      return (
        <Box className="visitante-form-grid">
          <Box className="visitante-search-row">
            <TextField
              fullWidth
              placeholder="Unidade destino"
              value={destinationQuery}
              onChange={(event) => {
                setDestinationQuery(event.target.value);
                setUnitSearched(false);
                setUnitSearchResult(null);
                setUnitSearchResults([]);
                setFormData((current) => ({
                  ...current,
                  destinationUnit: "",
                  destinationBlock: "",
                  selectedResidentId: "",
                  releaseType: "",
                }));
                clearFieldError("destinationUnit");
                clearFieldError("selectedResidentId");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleDestinationSearch();
                }
              }}
              error={Boolean(errors.destinationUnit)}
              helperText={errors.destinationUnit}
              disabled={destinationLoading}
            />
            <Button
              variant="outlined"
              className="action-button-edit"
              startIcon={<SearchOutlined />}
              onClick={() => void handleDestinationSearch()}
              disabled={destinationLoading || !destinationQuery.trim()}
            >
              Buscar
            </Button>
          </Box>

          {destinationLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="body2">Carregando destino...</Typography>
            </Box>
          ) : null}

          <Typography className="visitante-step-help">
            Selecione a unidade para localizar os moradores.
          </Typography>

          {unitSearchResults.length > 0 ? (
            <Box className="visitante-residents-list">
              <Typography className="visitante-section-title">
                Moradores
              </Typography>
              <Box className="visitante-residents-scroll" sx={{ height: '200px' }}>
                {unitSearchResults.flatMap((unit) =>
                  unit.residents.map((resident) => (
                    <Box
                      className={`visitante-resident-card ${formData.selectedResidentId === resident.id
                        ? "selected"
                        : ""
                        }`}
                      key={`${unit.id}-${resident.id}`}
                      onClick={() => handleResidentSelect(unit, resident)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleResidentSelect(unit, resident);
                        }
                      }}
                    >
                      <Box className="visitante-resident-icon">
                        <People />
                      </Box>
                      <Box className="visitante-resident-copy">
                        <Typography className="visitante-resident-name">
                          {resident.fullName}
                        </Typography>
                      </Box>
                    </Box>
                  )),
                )}
              </Box>
              {errors.selectedResidentId ? (
                <Typography className="visitante-error-text">
                  {errors.selectedResidentId}
                </Typography>
              ) : null}
            </Box>
          ) : null}

          {unitSearched &&
            !destinationLoading &&
            unitSearchResults.length === 0 &&
            !errors.destinationUnit ? (
            <Alert severity="warning" className="visitante-alert">
              Nenhum morador foi encontrado para a unidade pesquisada.
            </Alert>
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
          <TextField
            fullWidth
            select
            label={formData.visitorReasonId ? "" : "Motivo da visita"}
            value={formData.visitorReasonId}
            onChange={(event) =>
              handleChange("visitorReasonId", event.target.value)
            }
            error={Boolean(errors.visitorReasonId)}
            helperText={errors.visitorReasonId}
          >
            {visitorReasons.map((option) => (
              <MenuItem key={getEnumOptionValue(option)} value={getEnumOptionValue(option)}>
                {getEnumOptionLabel(option)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={2}
            size="small"
            className="visitante-notes-field"
            placeholder="Observações"
            value={formData.notes}
            onChange={(event) => handleChange("notes", event.target.value)}
            error={Boolean(errors.notes)}
            helperText={errors.notes}
          />
          <Box className="visitante-option-list">
            <Box
              className={`visitante-option-card ${formData.releaseType === "manual" ? "selected" : ""
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
                <Typography sx={{ textAlign: 'left !important' }} className="visitante-option-description">
                  Liberação feita manualmente pela equipe da portaria.
                </Typography>
              </Box>
            </Box>

            <Box
              className={`visitante-option-card ${formData.releaseType === "resident" ? "selected" : "disabled"
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
                <Typography sx={{ textAlign: 'center' }} className="visitante-option-description">
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

          <Alert sx={{ mb: 2 }} severity={residentCanManageAccess ? "success" : "info"}>
            {residentCanManageAccess
              ? "Usuário logado identificado como morador da unidade. A liberação direta está habilitada."
              : "Liberação direta pelo morador fica bloqueada até validar que o usuário logado pertence à unidade."}
          </Alert>
        </Box>
      );
    }

    return (
      <Box className="visitante-form-grid visitante-access-step">
        <Box className="visitante-section-card">
          <Box className="visitante-section-header">
            <Box>
              <Typography className="visitante-section-card-title">
                Controle de acesso por área
              </Typography>
              <Typography className="visitante-section-card-description">
                Defina quais áreas este visitante pode acessar.
              </Typography>
            </Box>
          </Box>

          <Box className="visitante-access-list">
            {areas.map((area) => (
              <Box className="visitante-access-card" key={area.areaId}>
                <Box className="visitante-access-copy">
                  <Box className="visitante-option-icon area">
                    {getAreaIcon(area)}
                  </Box>
                  <Typography className="visitante-option-title">
                    {area.name}
                  </Typography>
                </Box>
                <Checkbox
                  checked={Boolean(formData.areaAccess[area.areaId])}
                  onChange={(event) =>
                    handleAreaToggle(area.areaId, event.target.checked)
                  }
                  sx={{ p: 0.5 }}
                />
              </Box>
            ))}
          </Box>
        </Box>

        {areas.length === 0 ? (
          <Alert severity="info">
            Nenhuma area cadastrada para este condomínio.
          </Alert>
        ) : null}

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
        title={existingVisitor ? "Registrar Visita" : "Registrar Visitante"}
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
        width={getVisitorWizardWidth()}
        className={visitorCardClassName}
        disableContent={loading}
        actions={
          activeStep === stepLabels.length - 1 ? (
            <Button variant="contained" onClick={handleSubmit} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : "Concluir"}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={
                loading ||
                (activeStep === 2 &&
                  (!unitSearched ||
                    destinationLoading ||
                    !unitSearchResult ||
                    !formData.selectedResidentId))
              }
            >
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
