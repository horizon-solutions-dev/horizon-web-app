import { useEffect, useMemo, useRef, useState } from "react";
import "./ReservasTipo.scss";
import axios from "axios";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Article,
  Close,
  DeleteOutline,
  EditOutlined,
  ImageOutlined,
  LocationOn,
  Place,
  SearchOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import CardList from "../../shared/components/CardList";
import BreadcrumbTrail from "../../shared/components/BreadcrumbTrail";
import { AppStateModal } from "../../shared/components/AppStateModal";
import { useAppStateModal } from "../../shared/utils/useAppStateModal";
import StepWizardCard from "../../shared/components/StepWizardCard";
import { areaImageService } from "../../services/areaImageService";
import { areaService } from "../../services/areaService";
import {
  condominiumService,
  type Condominium,
} from "../../services/condominiumService";
import { organizationService } from "../../services/organizationService";
import type { AreaEnum, AreaRequest, AreaResponse } from "../../models/area.model";
import { formatCNPJ } from "../../shared/utils/funcoes";

type AreaFormState = {
  name: string;
  type: string;
  sizeM2: string;
  capacityPeople: string;
  startTime: string;
  endTime: string;
  operatingDays: string;
  hasReservationPrice: boolean;
  hasApprovalRequired: boolean;
  hasFee: boolean;
  feeAmount: string;
  hasDeposit: boolean;
  depositAmount: string;
  hasAllowsGuests: boolean;
  guestLimit: string;
  notes: string;
  imageFiles: Record<string, File | null>;
};

const emptyForm: AreaFormState = {
  name: "",
  type: "",
  sizeM2: "",
  capacityPeople: "",
  startTime: "08:00:00",
  endTime: "22:00:00",
  operatingDays: "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday",
  hasReservationPrice: false,
  hasApprovalRequired: false,
  hasFee: false,
  feeAmount: "0",
  hasDeposit: false,
  depositAmount: "0",
  hasAllowsGuests: false,
  guestLimit: "0",
  notes: "",
  imageFiles: {},
};

const getStoredOrganizationName = () => {
  const stored = localStorage.getItem("condominium");
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { name?: string; legalName?: string };
      return parsed?.name || parsed?.legalName || "";
    } catch {
      return "";
    }
  }

  return localStorage.getItem("organizationName") || "";
};

const toNumber = (value: string) => Number(value.replace(",", ".")) || 0;

const getEnumOptionLabel = (option: AreaEnum) =>
  option.description || option.value || String(option.id);

const getEnumOptionValue = (option?: AreaEnum) =>
  option ? String(option.value || option.id) : "";

const areaWizardSteps = [
  "Dados principais",
  "Regras de funcionamento",
  "Cobrança",
  "Uso",
  "Fotos",
];

const weekDays = [
  { key: "Monday", label: "S" },
  { key: "Tuesday", label: "T" },
  { key: "Wednesday", label: "Q" },
  { key: "Thursday", label: "Q" },
  { key: "Friday", label: "S" },
  { key: "Saturday", label: "S" },
  { key: "Sunday", label: "D" },
];

const areaFieldMap: Record<string, keyof AreaRequest> = {
  name: "name",
  type: "type",
  sizem2: "sizeM2",
  capacitypeople: "capacityPeople",
  starttime: "startTime",
  endtime: "endTime",
  operatingdays: "operatingDays",
  hasreservationprice: "hasReservationPrice",
  hasapprovalrequired: "hasApprovalRequired",
  hasfee: "hasFee",
  feeamount: "feeAmount",
  hasdeposit: "hasDeposit",
  depositamount: "depositAmount",
  hasallowsguests: "hasAllowsGuests",
  guestlimit: "guestLimit",
  notes: "notes",
  condominiumid: "condominiumId",
  commit: "commit",
};

const areaStepFields: Array<Array<keyof AreaRequest>> = [
  ["name", "type", "sizeM2", "capacityPeople", "notes"],
  ["startTime", "endTime", "operatingDays", "hasReservationPrice", "hasApprovalRequired"],
  ["hasFee", "feeAmount", "hasDeposit", "depositAmount"],
  ["hasAllowsGuests", "guestLimit", "notes"],
  [],
];

const getAreaImageUrl = (area: AreaResponse) => {
  if (!area.thumbnailFile || !area.contentType) return undefined;
  return `data:${area.contentType};base64,${area.thumbnailFile}`;
};

const toFormState = (area: AreaResponse): AreaFormState => ({
  name: area.name || "",
  type: String(area.type || ""),
  sizeM2: String(area.sizeM2 ?? ""),
  capacityPeople: String(area.capacityPeople ?? ""),
  startTime: area.startTime || "08:00:00",
  endTime: area.endTime || "22:00:00",
  operatingDays: area.operatingDays || emptyForm.operatingDays,
  hasReservationPrice: Boolean(area.hasReservationPrice),
  hasApprovalRequired: Boolean(area.hasApprovalRequired),
  hasFee: Boolean(area.hasFee),
  feeAmount: String(area.feeAmount ?? 0),
  hasDeposit: Boolean(area.hasDeposit),
  depositAmount: String(area.depositAmount ?? 0),
  hasAllowsGuests: Boolean(area.hasAllowsGuests),
  guestLimit: String(area.guestLimit ?? 0),
  notes: area.notes || "",
  imageFiles: {},
});

export default function ReservasTipo() {
  const navigate = useNavigate();
  const [organizationName] = useState(
    () => getStoredOrganizationName() || "Organizacao",
  );
  const [activeView, setActiveView] = useState<"condominios" | "areas">(
    "condominios",
  );
  const [loading, setLoading] = useState(false);
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [selectedCondominium, setSelectedCondominium] =
    useState<Condominium | null>(null);
  const [areas, setAreas] = useState<AreaResponse[]>([]);
  const [areaTypes, setAreaTypes] = useState<AreaEnum[]>([]);
  const [imageTypes, setImageTypes] = useState<AreaEnum[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [editingArea, setEditingArea] = useState<AreaResponse | null>(null);
  const [formData, setFormData] = useState<AreaFormState>(emptyForm);
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const imagePreviewsRef = useRef<Record<string, string>>({});
  const { appStateModal, handleClose, showSuccess, showError } =
    useAppStateModal();

  const filteredCondominiums = useMemo(
    () =>
      condominiums.filter((condominium) =>
        [condominium.name, condominium.doc, condominium.city, condominium.state]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      ),
    [condominiums, searchTerm],
  );

  const filteredAreas = useMemo(
    () =>
      areas.filter((area) =>
        [area.name, area.type, area.notes]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      ),
    [areas, searchTerm],
  );

  const loadCondominiums = async () => {
    setLoading(true);
    try {
      let organizationId = localStorage.getItem("organizationId") || "";
      if (!organizationId) {
        organizationId = (await organizationService.getMyOrganizationId()) || "";
      }
      if (!organizationId) {
        showError("Organizacao nao identificada para consultar condominios.");
        return;
      }
      const response = await condominiumService.getCondominiums(
        organizationId,
        1,
        100,
      );
      setCondominiums(response.items ?? []);
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro ao carregar condominios.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAreaTypes = async () => {
    try {
      setAreaTypes(await areaService.getAreaTypes());
    } catch {
      setAreaTypes([]);
    }
  };

  const loadAreaImageTypes = async () => {
    try {
      const types = await areaImageService.getAreaImageTypes();
      setImageTypes(types);
    } catch {
      setImageTypes([]);
    }
  };

  const loadExistingAreaImages = async (areaId: string) => {
    try {
      const images = await areaImageService.getAreaImages(areaId);
      const entries = await Promise.all(
        images.map(async (image) => {
          if (!image.imageType) return null;

          if (image.contentFile && image.contentType) {
            return [
              String(image.imageType),
              `data:${image.contentType};base64,${image.contentFile}`,
            ] as const;
          }

          const downloaded = await areaImageService.downloadAreaImage(
            image.areaImageId,
          );
          if (!downloaded.contentFile || !downloaded.contentType) return null;

          return [
            String(image.imageType),
            `data:${downloaded.contentType};base64,${downloaded.contentFile}`,
          ] as const;
        }),
      );
      const previews = entries.reduce<Record<string, string>>((acc, entry) => {
        if (entry) {
          acc[entry[0]] = entry[1];
        }
        return acc;
      }, {});

      imagePreviewsRef.current = previews;
      setImagePreviews(previews);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return;
      }
      console.error("Erro ao carregar imagens da area:", error);
    }
  };

  const loadAreas = async (condominium = selectedCondominium) => {
    if (!condominium?.condominiumId) return;
    setLoading(true);
    try {
      const response = await areaService.getAreas(
        condominium.condominiumId,
        1,
        100,
      );
      setAreas(response.items ?? []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCondominiums();
    void loadAreaTypes();
    void loadAreaImageTypes();
  }, []);

  useEffect(() => {
    return () => {
      Object.values(imagePreviewsRef.current).forEach((preview) =>
        URL.revokeObjectURL(preview),
      );
    };
  }, []);

  const handleSelectCondominium = async (condominium: Condominium) => {
    setSelectedCondominium(condominium);
    setSearchTerm("");
    setActiveView("areas");
    await loadAreas(condominium);
  };

  const openCreate = () => {
    setEditingArea(null);
    setFormStep(0);
    setFormData(emptyForm);
    imagePreviewsRef.current = {};
    setImagePreviews({});
    setIsFormOpen(true);
  };

  const openEdit = (area: AreaResponse) => {
    setEditingArea(area);
    setFormStep(0);
    setFormData(toFormState(area));
    imagePreviewsRef.current = {};
    setImagePreviews({});
    setIsFormOpen(true);
    void loadExistingAreaImages(area.areaId);
  };

  const closeWizard = () => {
    Object.values(imagePreviewsRef.current).forEach((preview) =>
      URL.revokeObjectURL(preview),
    );
    imagePreviewsRef.current = {};
    setImagePreviews({});
    setIsFormOpen(false);
    setFormStep(0);
  };

  const handleWizardBack = () => {
    if (formStep === 0) {
      closeWizard();
      return;
    }
    setFormStep((current) => current - 1);
  };

  const getValidationMessageForStep = (
    validations: Array<{ field: string; message: string }>,
    step: number,
  ) => {
    const stepFields = areaStepFields[step] ?? [];
    const currentStepValidation = validations.find((validation) => {
      const key = validation.field?.replace(/\s+/g, "").toLowerCase();
      const field = key ? areaFieldMap[key] : undefined;
      return field ? stepFields.includes(field) : false;
    });

    return currentStepValidation?.message || "";
  };

  const getAreaRequestErrorMessage = (error: unknown, fallback: string) => {
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

  const validateCurrentStep = async () => {
    if (!selectedCondominium?.condominiumId) {
      showError("Selecione um condominio antes de continuar.");
      return false;
    }

    if (formStep === 0 && (!formData.name.trim() || !formData.type)) {
      showError("Informe nome e tipo da area.");
      return false;
    }

    setLoading(true);
    try {
      const payload = buildStepValidationPayload();
      const { valid, validations } = editingArea
        ? await areaService.validateAreaEdit(editingArea.areaId, payload)
        : await areaService.validateArea(payload);
      if (!valid && validations.length > 0) {
        const message = getValidationMessageForStep(validations, formStep);
        if (message) {
          showError(message);
          return false;
        }
      }

      return true;
    } catch (error) {
      showError(getAreaRequestErrorMessage(error, "Erro ao validar area."));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleWizardNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;
    setFormStep((current) => current + 1);
  };

  const toggleOperatingDay = (day: string) => {
    setFormData((current) => {
      const days = current.operatingDays
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const nextDays = days.includes(day)
        ? days.filter((item) => item !== day)
        : [...days, day];

      return {
        ...current,
        operatingDays: nextDays.join(","),
      };
    });
  };

  const handleAreaImageChange = (imageType: string, file: File | null) => {
    setImagePreviews((current) => {
      const previousPreview = current[imageType];
      if (previousPreview) URL.revokeObjectURL(previousPreview);

      const next = { ...current };
      if (file) {
        next[imageType] = URL.createObjectURL(file);
      } else {
        delete next[imageType];
      }

      imagePreviewsRef.current = next;
      return next;
    });

    setFormData((current) => ({
      ...current,
      imageFiles: {
        ...current.imageFiles,
        [imageType]: file,
      },
    }));
  };

  const buildStepValidationPayload = (): AreaRequest => {
    const payload = buildPayload(false);

    if (formStep < 1) {
      return {
        ...payload,
        operatingDays: "",
        hasReservationPrice: false,
        hasApprovalRequired: false,
        hasFee: false,
        feeAmount: 0,
        hasDeposit: false,
        depositAmount: 0,
        hasAllowsGuests: false,
        guestLimit: 0,
      };
    }

    if (formStep < 2) {
      return {
        ...payload,
        hasFee: false,
        feeAmount: 0,
        hasDeposit: false,
        depositAmount: 0,
        hasAllowsGuests: false,
        guestLimit: 0,
      };
    }

    if (formStep < 3) {
      return {
        ...payload,
        hasAllowsGuests: false,
        guestLimit: 0,
      };
    }

    return payload;
  };

  const buildPayload = (commit: boolean): AreaRequest => ({
    name: formData.name.trim(),
    type: formData.type,
    sizeM2: toNumber(formData.sizeM2),
    capacityPeople: toNumber(formData.capacityPeople),
    startTime: formData.startTime,
    endTime: formData.endTime,
    operatingDays: formData.operatingDays.trim(),
    hasReservationPrice: formData.hasReservationPrice,
    hasApprovalRequired: formData.hasApprovalRequired,
    hasFee: formData.hasFee,
    feeAmount: toNumber(formData.feeAmount),
    hasDeposit: formData.hasDeposit,
    depositAmount: toNumber(formData.depositAmount),
    hasAllowsGuests: formData.hasAllowsGuests,
    guestLimit: toNumber(formData.guestLimit),
    notes: formData.notes.trim(),
    condominiumId: selectedCondominium?.condominiumId || "",
    commit,
  });

  const handleSave = async () => {
    if (!selectedCondominium?.condominiumId) {
      showError("Selecione um condominio antes de salvar a area.");
      return;
    }
    if (!formData.name.trim() || !formData.type) {
      showError("Informe nome e tipo da area.");
      return;
    }

    setLoading(true);
    try {
      const payload = buildPayload(true);
      const response = editingArea
        ? await areaService.updateArea(editingArea.areaId, payload)
        : await areaService.createArea(payload);
      const areaId = editingArea?.areaId || response.areaId;

      const selectedImages = Object.entries(formData.imageFiles).filter(
        (entry): entry is [string, File] => Boolean(entry[1]),
      );

      if (selectedImages.length > 0) {
        await Promise.all(
          selectedImages.map(([imageType, file]) =>
            areaImageService.uploadAreaImage(areaId, file, imageType),
          ),
        );
      }

      closeWizard();
      showSuccess(editingArea ? "Area alterada com sucesso." : "Area criada com sucesso.");
      await loadAreas();
    } catch (error) {
      showError(getAreaRequestErrorMessage(error, "Erro ao salvar area."));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (area: AreaResponse) => {
    if (!window.confirm(`Deseja excluir a area ${area.name}?`)) return;
    setLoading(true);
    try {
      await areaService.deleteArea(area.areaId);
      showSuccess("Area excluida com sucesso.");
      await loadAreas();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Erro ao excluir area.");
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (value: string | number) => {
    const match = areaTypes.find(
      (type) => type.value === value || type.id === value || String(type.id) === String(value),
    );
    return match ? getEnumOptionLabel(match) : String(value || "-");
  };

  useEffect(()=>{
    console.log(formData.type)
  },[formData.type, formData])

  const renderWizardStep = (formStep: number) => {
    if (formStep === 0) {
      return (
        <Box className="area-wizard-grid">

          <TextField
            fullWidth
            label={formData.name ? "" : "Nome"}
            value={formData.name}
            onChange={(event) =>
              setFormData((current) => ({ ...current, name: event.target.value }))
            }
          />

          <TextField
            fullWidth
            select
            label={formData.type ? "" : "Tipo"}
            value={formData.type == "1" ? areaTypes.find((f) => f.id == formData.type)?.value  : formData.type}
            onChange={(event) =>
              setFormData((current) => ({ ...current, type: event.target.value }))
            }
          >
            <MenuItem value="" disabled>
              Selecionar tipos
            </MenuItem>
            {areaTypes.map((type) => (
              <MenuItem key={getEnumOptionValue(type)} value={getEnumOptionValue(type)}>
                {getEnumOptionLabel(type)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            sx={{height:100}}
            multiline
            minRows={1}
            label={formData.notes ? "" : "Descrição"}
            value={formData.notes}
            onChange={(event) =>
              setFormData((current) => ({ ...current, notes: event.target.value }))
            }
          />

          <TextField
            fullWidth
            label={formData.sizeM2 ? "" : "Tamanho"}
            value={formData.sizeM2}
            onChange={(event) =>
              setFormData((current) => ({ ...current, sizeM2: event.target.value }))
            }
            InputProps={{ endAdornment: <Typography color="text.secondary">m²</Typography> }}
          />

          <TextField
            fullWidth
            label={formData.capacityPeople ? "" : "Capacidade"}
            value={formData.capacityPeople}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                capacityPeople: event.target.value,
              }))
            }
            InputProps={{
              endAdornment: <Typography color="text.secondary">pessoas</Typography>,
            }}
          />
        </Box>
      );
    }

    if (formStep === 1) {
      const selectedDays = formData.operatingDays.split(",").map((day) => day.trim());

      return (
        <Box className="area-wizard-grid">

          <Box className="area-wizard-panel">
            <Typography className="area-wizard-panel-title">Funcionamento</Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Horário inicial"
                  value={formData.startTime}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      startTime: event.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Horário final"
                  value={formData.endTime}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, endTime: event.target.value }))
                  }
                />
              </Grid>
            </Grid>

            <Typography className="area-wizard-label">Dias permitidos</Typography>
            <Box className="area-days-row">
              {weekDays.map((day) => (
                <button
                  key={day.key}
                  type="button"
                  className={selectedDays.includes(day.key) ? "selected" : ""}
                  onClick={() => toggleOperatingDay(day.key)}
                >
                  {day.label}
                </button>
              ))}
            </Box>

            <Box className="area-switch-row">
              <Typography>Precisa de reserva</Typography>
              <Switch
                checked={formData.hasReservationPrice}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    hasReservationPrice: event.target.checked,
                  }))
                }
              />
            </Box>
            <Box className="area-switch-row">
              <Typography>Necessita aprovação</Typography>
              <Switch
                checked={formData.hasApprovalRequired}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    hasApprovalRequired: event.target.checked,
                  }))
                }
              />
            </Box>
          </Box>
        </Box>
      );
    }

    if (formStep === 2) {
      return (
        <Box className="area-wizard-grid">

          <Box className="area-wizard-panel">
            <Box className="area-switch-row">
              <Typography className="area-wizard-panel-title">Tem taxa</Typography>
              <Switch
                checked={formData.hasFee}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, hasFee: event.target.checked }))
                }
              />
            </Box>
            <TextField
              fullWidth
              label="Valor da taxa"
              value={formData.feeAmount}
              disabled={!formData.hasFee}
              onChange={(event) =>
                setFormData((current) => ({ ...current, feeAmount: event.target.value }))
              }
              InputProps={{ endAdornment: <Typography color="text.secondary">R$</Typography> }}
            />

            <Box className="area-switch-row">
              <Typography className="area-wizard-panel-title">Tem caução</Typography>
              <Switch
                checked={formData.hasDeposit}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    hasDeposit: event.target.checked,
                  }))
                }
              />
            </Box>
            <TextField
              fullWidth
              label="Valor da caução"
              value={formData.depositAmount}
              disabled={!formData.hasDeposit}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  depositAmount: event.target.value,
                }))
              }
              InputProps={{ endAdornment: <Typography color="text.secondary">R$</Typography> }}
            />
          </Box>
        </Box>
      );
    }

    if (formStep === 3) {
      return (
        <Box className="area-wizard-grid">

          <Box className="area-wizard-panel">
            <Box className="area-switch-row">
              <Typography className="area-wizard-panel-title">
                Permite convidados
              </Typography>
              <Switch
                checked={formData.hasAllowsGuests}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    hasAllowsGuests: event.target.checked,
                  }))
                }
              />
            </Box>
            <TextField
              fullWidth
              label="Limite de convidados"
              value={formData.guestLimit}
              disabled={!formData.hasAllowsGuests}
              onChange={(event) =>
                setFormData((current) => ({ ...current, guestLimit: event.target.value }))
              }
            />
          </Box>
        </Box>
      );
    }

    return (
      <Box className="area-wizard-grid">

        {imageTypes.length === 0 ? (
          <Box className="area-upload-empty">
            <Box className="area-upload-icon">
              <ImageOutlined />
            </Box>
            <Typography className="area-upload-title">
              Nenhum tipo de imagem disponível
            </Typography>
            <Typography className="area-upload-hint">
              Os tipos de imagem devem ser retornados pela API.
            </Typography>
          </Box>
        ) : null}

        <Box className="area-upload-grid">
          {imageTypes.map((type, index) => {
            const imageType = getEnumOptionValue(type);
            const selectedFile = formData.imageFiles[imageType];
            const previewUrl = imagePreviews[imageType];

            return (
              <Box
                className={`area-upload-box ${index === 0 ? "main" : ""}`}
                key={imageType}
              >
                {previewUrl ? (
                  <Box className="area-upload-preview-card">
                    <Box
                      component="img"
                      src={previewUrl}
                      alt={getEnumOptionLabel(type)}
                      className="area-upload-preview"
                    />
                    <Box className="area-upload-preview-footer">
                      <Box className="area-upload-preview-copy">
                        <Typography className="area-upload-title">
                          {getEnumOptionLabel(type)}
                        </Typography>
                        <Typography className="area-upload-filename">
                          {selectedFile?.name}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        className="area-upload-remove"
                        onClick={() => handleAreaImageChange(imageType, null)}
                        aria-label="Remover imagem"
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ) : (
                  <Button component="label" variant="text" className="area-upload-trigger">
                    <Box className="area-upload-icon">
                      <ImageOutlined />
                    </Box>
                    <Typography className="area-upload-title">
                      {getEnumOptionLabel(type)}
                    </Typography>
                    <Typography className="area-upload-hint">
                      Toque para selecionar uma imagem
                    </Typography>
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        handleAreaImageChange(
                          imageType,
                          event.target.files?.[0] || null,
                        );
                        event.target.value = "";
                      }}
                    />
                  </Button>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  if (isFormOpen) {
    return (
      <>
        <StepWizardCard
          title="Registrar Área"
          subtitle={areaWizardSteps[formStep]}
          steps={areaWizardSteps}
          activeStep={formStep}
          showBack
          onBack={handleWizardBack}
          onClose={closeWizard}
          width="min(760px, calc(100vw - 32px))"
          disableContent={loading}
          actions={
            formStep === areaWizardSteps.length - 1 ? (
              <Button variant="contained" onClick={() => void handleSave()} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : "Salvar"}
              </Button>
            ) : (
              <Button variant="contained" onClick={() => void handleWizardNext()} disabled={loading}>
                Avançar
              </Button>
            )
          }
        >
          {renderWizardStep(formStep)}
        </StepWizardCard>

        <AppStateModal
          open={appStateModal.open}
          type={appStateModal.type}
          title={appStateModal.title}
          message={appStateModal.message}
          detail={appStateModal.detail}
          item={appStateModal.item}
          onConfirm={handleClose}
          onClose={handleClose}
        />
      </>
    );
  }

  return (
    <Box className="page-container">
      <Container maxWidth="xl">
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box
            sx={{
              mb: 2,
              pb: 1.5,
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
              borderBottom: "2px solid #f0f0f0",
            }}
          >
            <Container
              sx={{
                p: "0 !important",
                maxWidth: "100vw !important",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Place sx={{ fontSize: 36, color: "#1976d2" }} />
                <Typography variant="h5" fontWeight="bold" sx={{ fontSize: 26 }}>
                  {organizationName}
                </Typography>
              </Box>
              <Tooltip title="Clique aqui para Fechar a janela">
                <IconButton
                  onClick={() => {
                    if (activeView === "areas") {
                      setActiveView("condominios");
                      setSelectedCondominium(null);
                      setAreas([]);
                      return;
                    }
                    navigate("/dashboard");
                  }}
                  className="close-button"
                  aria-label="Fechar"
                >
                  <Close sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            </Container>
            <BreadcrumbTrail
              items={[
                "Organizacao",
                selectedCondominium?.name || "Condominios",
                "Areas",
              ]}
            />
          </Box>

          <Paper variant="outlined" sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">Carregando...</Typography>
              </Box>
            ) : null}

            {activeView === "condominios" ? (
              <CardList
                title="Condominios"
                showTitle={false}
                searchPlaceholder="Buscar condominio..."
                onSearchChange={setSearchTerm}
                onAddClick={undefined}
                addButtonPlacement="toolbar"
                emptyImageLabel="Sem imagem"
                showFilters
                showPagination={false}
                items={filteredCondominiums.map((condominium, index) => ({
                  id: condominium.condominiumId,
                  title: condominium.name,
                  subtitle: (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                        <Article sx={{ fontSize: 16 }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatCNPJ(condominium.doc) || "-"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                        <LocationOn sx={{ fontSize: 16 }} />
                        <Typography variant="body2" color="text.secondary">
                          {condominium.city} - {condominium.state}
                        </Typography>
                      </Box>
                    </Box>
                  ),
                  actions: (
                    <Button
                      size="small"
                      variant="outlined"
                      className="action-button-manage"
                      startIcon={<SearchOutlined />}
                      onClick={() => void handleSelectCondominium(condominium)}
                    >
                      Ver areas
                    </Button>
                  ),
                  imageUrl:
                    condominium.thumbnailFile && condominium.contentType
                      ? `data:${condominium.contentType};base64,${condominium.thumbnailFile}`
                      : undefined,
                  accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                }))}
              />
            ) : (
              <CardList
                title="Areas"
                showTitle={false}
                searchPlaceholder="Buscar area..."
                onSearchChange={setSearchTerm}
                onAddClick={openCreate}
                addButtonPlacement="toolbar"
                emptyImageLabel="Sem imagem"
                showFilters
                showPagination={false}
                imageWidth={150}
                imageHeight={108}
                cardMaxHeight="none"
                items={filteredAreas.map((area, index) => ({
                  id: area.areaId,
                  title: area.name,
                  badge: getTypeLabel(area.type),
                  subtitle: (
                    <Typography variant="body2" color="text.secondary">
                      Capacidade: {area.capacityPeople || 0} pessoas | {area.startTime} - {area.endTime}
                    </Typography>
                  ),
                  meta: (
                    <Typography variant="caption" color="text.secondary">
                      {area.hasFee ? `Taxa: R$ ${area.feeAmount || 0}` : "Sem taxa"} |{" "}
                      {area.hasApprovalRequired ? "Exige aprovacao" : "Sem aprovacao"}
                    </Typography>
                  ),
                  actions: (
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        className="action-button-edit"
                        startIcon={<EditOutlined />}
                        onClick={() => openEdit(area)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        className="action-button-delete"
                        startIcon={<DeleteOutline />}
                        onClick={() => void handleDelete(area)}
                      >
                        Excluir
                      </Button>
                    </Box>
                  ),
                  imageUrl: getAreaImageUrl(area),
                  accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                }))}
              />
            )}
          </Paper>
        </Paper>
      </Container>

      <AppStateModal
        open={appStateModal.open}
        type={appStateModal.type}
        title={appStateModal.title}
        message={appStateModal.message}
        detail={appStateModal.detail}
        item={appStateModal.item}
        onConfirm={handleClose}
        onClose={handleClose}
      />
    </Box>
  );
}
