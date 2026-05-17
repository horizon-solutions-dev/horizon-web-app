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
  Apartment,
  Article,
  AccessTime,
  Close,
  DeleteOutline,
  EditOutlined,
  GroupsOutlined,
  ImageOutlined,
  LocationOn,
  PaidOutlined,
  SearchOutlined,
  Pool,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import CardList from "../../shared/components/CardList";
import BreadcrumbTrail from "../../shared/components/BreadcrumbTrail";
import ImageUploadField from "../../shared/components/ImageUploadField";
import { AppStateModal } from "../../shared/components/AppStateModal";
import { useAppStateModal } from "../../shared/utils/useAppStateModal";
import { desabilitarCampos } from "../../shared/utils/desabilitarCampos";
import StepWizardCard from "../../shared/components/StepWizardCard";
import { areaImageService } from "../../services/areaImageService";
import { areaService } from "../../services/areaService";
import {
  condominiumService,
  type Condominium,
  type CondominiumTypeEnum,
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
  feeAmount: "0,00",
  hasDeposit: false,
  depositAmount: "0,00",
  hasAllowsGuests: false,
  guestLimit: "0",
  notes: "",
  imageFiles: {},
};

const formatOperatingTimeInput = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 6);

  let hh = digits.slice(0, 2);
  let mm = digits.slice(2, 4);
  let ss = digits.slice(4, 6);

  // valida hora
  if (hh.length === 2) {
    const hour = Math.min(Number(hh), 23);
    hh = hour.toString().padStart(2, "0");
  }

  // valida minuto
  if (mm.length === 2) {
    const minute = Math.min(Number(mm), 59);
    mm = minute.toString().padStart(2, "0");
  }

  // valida segundo
  if (ss.length === 2) {
    const second = Math.min(Number(ss), 59);
    ss = second.toString().padStart(2, "0");
  }

  return [hh, mm, ss].filter(Boolean).join(":");
};

const AREA_SIZE_MAX = 99999.99;
const PEOPLE_MAX = 999;
const GUEST_LIMIT_MAX = 999;
const MONEY_MAX = 9999.99;

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

const toNumber = (value: string) => {
  const normalized = value.includes(",")
    ? value.replace(/\./g, "").replace(",", ".")
    : value;

  return Number(normalized) || 0;
};

const clampNumber = (value: number, maxValue: number) =>
  Math.min(Math.max(value, 0), maxValue);

const toLimitedNumber = (value: string, maxValue: number) =>
  clampNumber(toNumber(value), maxValue);

const formatCurrencyValue = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatCurrencyInput = (value: string, maxValue: number) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  const amount = Math.min(Number(digits) / 100, maxValue);
  return formatCurrencyValue(amount);
};

const formatDecimalInput = (value: string, maxValue: number) =>
  formatCurrencyInput(value, maxValue);

const getEnumOptionLabel = (option: AreaEnum) =>
  option.description || option.value || String(option.id);

const getEnumOptionValue = (option?: AreaEnum) =>
  option ? String(option.value || option.id) : "";

const normalizeEnumOptionValue = (
  value: string | number | undefined,
  options: AreaEnum[],
) => {
  const rawValue = String(value ?? "").trim();
  if (!rawValue) return "";

  const normalizedValue = rawValue.toLowerCase();
  const matchingOption = options.find((option) => {
    const candidates = [
      option.id,
      option.value,
      option.description,
      getEnumOptionValue(option),
    ].map((candidate) => String(candidate ?? "").trim().toLowerCase());

    return candidates.includes(normalizedValue);
  });

  return matchingOption ? getEnumOptionValue(matchingOption) : rawValue;
};

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

const limitText = (value: string, maxLength: number) =>
  value.slice(0, maxLength);

const limitInteger = (value: string, maxLength: number, maxValue: number) => {
  const digits = value.replace(/\D/g, "").slice(0, maxLength);
  if (!digits) return "";
  return String(Math.min(Number(digits), maxValue));
};

const toFormState = (area: AreaResponse): AreaFormState => ({
  name: area.name || "",
  type: String(area.type || ""),
  sizeM2:
    area.sizeM2 === null || area.sizeM2 === undefined
      ? ""
      : formatCurrencyValue(area.sizeM2),
  capacityPeople: String(area.capacityPeople ?? ""),
  startTime: area.startTime || "08:00:00",
  endTime: area.endTime || "22:00:00",
  operatingDays: area.operatingDays || emptyForm.operatingDays,
  hasReservationPrice: Boolean(area.hasReservationPrice),
  hasApprovalRequired: Boolean(area.hasApprovalRequired),
  hasFee: Boolean(area.hasFee),
  feeAmount: formatCurrencyValue(area.feeAmount ?? 0),
  hasDeposit: Boolean(area.hasDeposit),
  depositAmount: formatCurrencyValue(area.depositAmount ?? 0),
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
  const [condoPage, setCondoPage] = useState(1);
  const [condoTotalPages, setCondoTotalPages] = useState(1);
  const [condominiumTypes, setCondominiumTypes] = useState<
    CondominiumTypeEnum[]
  >([]);
  const [selectedCondominium, setSelectedCondominium] =
    useState<Condominium | null>(null);
  const [areas, setAreas] = useState<AreaResponse[]>([]);
  const [areaPage, setAreaPage] = useState(1);
  const [areaTotalPages, setAreaTotalPages] = useState(1);
  const [areaTypes, setAreaTypes] = useState<AreaEnum[]>([]);
  const [imageTypes, setImageTypes] = useState<AreaEnum[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [editingArea, setEditingArea] = useState<AreaResponse | null>(null);
  const [formData, setFormData] = useState<AreaFormState>(emptyForm);
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [mainAreaPreviews, setMainAreaPreviews] = useState<Record<string, string>>({});
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

  const condoPageSize = 4;

  const loadCondominiums = async (pageNumber = 1) => {
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
        pageNumber,
        condoPageSize,
      );
      const items = response.items ?? [];
      setCondominiums(items);
      setCondoPage(response.paging?.pageNumber ?? pageNumber);
      setCondoTotalPages(
        response.paging?.totalPages ??
          Math.max(
            1,
            Math.ceil((response.paging?.total ?? items.length) / condoPageSize),
          ),
      );
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const loadCondominiumTypes = async () => {
    try {
      const data = await condominiumService.getCondominiumTypes();
      setCondominiumTypes(data ?? []);
    } catch {
      setCondominiumTypes([]);
    }
  };

  const getCondominiumTypeLabel = (value: string | number) => {
    const match = condominiumTypes.find(
      (type) => type.id === value || type.value === value,
    );
    return match?.description || match?.value || String(value || "-");
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
      return types;
    } catch {
      setImageTypes([]);
      return [];
    }
  };

  const getAreaImagePreview = async (areaImageId: string) => {
    const image = await areaImageService.getAreaImageById(areaImageId);
    if (!image.contentFile || !image.contentType) return null;

    return `data:${image.contentType};base64,${image.contentFile}`;
  };

  const loadExistingAreaImages = async (areaId: string, types = imageTypes) => {
    try {
      const resolvedTypes = types.length > 0 ? types : await loadAreaImageTypes();
      const entries = await Promise.all(
        resolvedTypes.map(async (type) => {
          try {
            const imageType = getEnumOptionValue(type);
            if (!imageType) return null;

            const images = await areaImageService.getAreaImages(areaId, imageType);
            const image = images[0];
            if (!image?.areaImageId) {
              return null;
            }

            const previewUrl =
              image.contentFile && image.contentType
                ? `data:${image.contentType};base64,${image.contentFile}`
                : await getAreaImagePreview(image.areaImageId);

            return previewUrl ? ([imageType, previewUrl] as const) : null;
          } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
              return null;
            }
            console.error("Erro ao carregar imagem da area por tipo:", error);
            return null;
          }
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

  const loadMainAreaPreviews = async (items: AreaResponse[]) => {
    const previews = await Promise.all(
      items.map(async (area) => {
        try {
          const images = await areaImageService.getAreaImages(area.areaId, "Main");
          const image = images[0];
          if (!image?.areaImageId) return null;

          const previewUrl =
            image.contentFile && image.contentType
              ? `data:${image.contentType};base64,${image.contentFile}`
              : await getAreaImagePreview(image.areaImageId);

          return previewUrl ? ([area.areaId, previewUrl] as const) : null;
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null;
          }
          console.error("Erro ao carregar imagem principal da area:", error);
          return null;
        }
      }),
    );

    setMainAreaPreviews(
      previews.reduce<Record<string, string>>((acc, entry) => {
        if (entry) acc[entry[0]] = entry[1];
        return acc;
      }, {}),
    );
  };

  const areaPageSize = 4;

  const loadAreas = async (
    condominium = selectedCondominium,
    pageNumber = areaPage,
  ) => {
    if (!condominium?.condominiumId) return;
    setLoading(true);
    try {
      const response = await areaService.getAreas(
        condominium.condominiumId,
        pageNumber,
        areaPageSize,
      );
      const items = response.items ?? [];
      setAreas(items);
      setAreaPage(response.paging?.pageNumber ?? pageNumber);
      setAreaTotalPages(
        response.paging?.totalPages ??
          Math.max(
            1,
            Math.ceil((response.paging?.total ?? items.length) / areaPageSize),
          ),
      );
      await loadMainAreaPreviews(items);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCondominiums(1);
    void loadCondominiumTypes();
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
    setAreaPage(1);
    setAreaTotalPages(1);
    setActiveView("areas");
    await loadAreas(condominium, 1);
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
    void (async () => {
      const types = await loadAreaImageTypes();
      await loadExistingAreaImages(area.areaId, types);
    })();
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
      showError("Informe nome e tipo da área.");
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
      showError(getAreaRequestErrorMessage(error, "Erro ao validar área."));
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
    type: normalizeEnumOptionValue(formData.type, areaTypes),
    sizeM2: toLimitedNumber(formData.sizeM2, AREA_SIZE_MAX),
    capacityPeople: toLimitedNumber(formData.capacityPeople, PEOPLE_MAX),
    startTime: formData.startTime,
    endTime: formData.endTime,
    operatingDays: formData.operatingDays.trim(),
    hasReservationPrice: formData.hasReservationPrice,
    hasApprovalRequired: formData.hasApprovalRequired,
    hasFee: formData.hasFee,
    feeAmount: formData.hasFee ? toLimitedNumber(formData.feeAmount, MONEY_MAX) : 0,
    hasDeposit: formData.hasDeposit,
    depositAmount: formData.hasDeposit
      ? toLimitedNumber(formData.depositAmount, MONEY_MAX)
      : 0,
    hasAllowsGuests: formData.hasAllowsGuests,
    guestLimit: formData.hasAllowsGuests
      ? toLimitedNumber(formData.guestLimit, GUEST_LIMIT_MAX)
      : 0,
    notes: formData.notes.trim(),
    condominiumId: selectedCondominium?.condominiumId || "",
    commit,
  });

  const handleSave = async () => {
    if (!selectedCondominium?.condominiumId) {
      showError("Selecione um condominio antes de salvar a área.");
      return;
    }
    if (!formData.name.trim() || !formData.type) {
      showError("Informe nome e tipo da área.");
      return;
    }

    setLoading(true);
    try {
      const payload = buildPayload(true);
      const response = editingArea
        ? await areaService.updateArea(editingArea.areaId, payload)
        : await areaService.createArea(payload);
      const areaId = editingArea?.areaId || response;

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
      showSuccess(editingArea ? "Área alterada com sucesso." : "Área criada com sucesso.");
      await loadAreas(selectedCondominium, areaPage);
    } catch (error) {
      showError(getAreaRequestErrorMessage(error, "Erro ao salvar área."));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (area: AreaResponse) => {
    if (!window.confirm(`Deseja excluir a área ${area.name}?`)) return;
    setLoading(true);
    try {
      await areaService.deleteArea(area.areaId);
      showSuccess("Área excluida com sucesso.");
      await loadAreas(selectedCondominium, areaPage);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Erro ao excluir área.");
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

  const renderWizardStep = (formStep: number) => {
    if (formStep === 0) {
      const selectedAreaType = normalizeEnumOptionValue(formData.type, areaTypes);

      return (
        <Box className="area-wizard-grid">

          <TextField
            fullWidth
            placeholder="Nome"
            value={formData.name}
            onChange={(event) =>
              setFormData((current) => ({ ...current, name: limitText(event.target.value, 80) }))
            }
            inputProps={{ maxLength: 80 }}
          />

          <TextField
            fullWidth
            select
            label={formData.type ? "" : "Tipo"}
            value={selectedAreaType}
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
            sx={{ height: 100, padding: 0, maxHeight: 100 }}
            multiline
            minRows={1}
            placeholder="Descrição"
            value={formData.notes}
            maxRows={3}
            onChange={(event) =>
              setFormData((current) => ({ ...current, notes: event.target.value }))
            }
            inputProps={{ maxLength: 90 }}
          />

          <TextField
            fullWidth
            placeholder="Tamanho"
            value={formData.sizeM2}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                sizeM2: formatDecimalInput(event.target.value, AREA_SIZE_MAX),
              }))
            }
            inputProps={{
              min: 0,
              max: AREA_SIZE_MAX,
              step: "0.01",
              inputMode: "numeric"
            }}
            InputProps={{ endAdornment: <Typography color="text.secondary">m²</Typography> }}
          />

          <TextField
            fullWidth
            placeholder="Capacidade"
            value={formData.capacityPeople}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                capacityPeople: limitInteger(
                  event.target.value,
                  3,
                  PEOPLE_MAX,
                ),
              }))
            }
            inputProps={{
              min: 0,
              max: PEOPLE_MAX,
              step: 1,
              inputMode: "numeric",
              pattern: "[0-9]*",
            }}
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
                  placeholder="Horário inicial"
                  value={formData.startTime}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      startTime: formatOperatingTimeInput(event.target.value),
                    }))
                  }
                  inputProps={{ inputMode: "numeric", maxLength: 8 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Horário final"
                  value={formData.endTime}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      endTime: formatOperatingTimeInput(event.target.value),
                    }))
                  }
                  inputProps={{ inputMode: "numeric", maxLength: 8 }}
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
              <Typography
                className={
                  formData.hasReservationPrice ? "area-switch-label active" : "area-switch-label"
                }
              >
                Precisa de reserva
              </Typography>
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
              <Typography
                className={
                  formData.hasApprovalRequired ? "area-switch-label active" : "area-switch-label"
                }
              >
                Necessita aprovação
              </Typography>
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
                onChange={(event) => {
                  if (event.target.checked) {
                    setFormData((current) => ({ ...current, hasFee: event.target.checked }))
                  } else {
                    setFormData((current) => ({ ...current, hasFee: event.target.checked, feeAmount: formatCurrencyInput(event.target.value, MONEY_MAX), }))
                  }
                }
                }
              />
            </Box>
            <TextField
              fullWidth
              placeholder="Valor da taxa"
              value={formData.feeAmount}
              disabled={!formData.hasFee}
              sx={!formData.hasFee ? desabilitarCampos :  undefined }
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  feeAmount: formatCurrencyInput(event.target.value, MONEY_MAX),
                }))
              }
              inputProps={{ inputMode: "numeric" }}
              InputProps={{
                endAdornment: (
                  <Typography color={formData.hasFee ? "text.primary" : "text.secondary"}>
                    R$
                  </Typography>
                ),
              }}
            />

            <Box className="area-switch-row">
              <Typography className="area-wizard-panel-title">Tem caução</Typography>
              <Switch
                checked={formData.hasDeposit}
                onChange={(event) => {
                  if (event.target.checked) {
                    setFormData((current) => ({
                      ...current,
                      hasDeposit: event.target.checked,
                    }))
                  } else {
                    setFormData((current) => ({ ...current, hasDeposit: event.target.checked, depositAmount: formatCurrencyInput(
                    event.target.value,
                    MONEY_MAX,
                  ), }))
                  }
                }
                }
              />
            </Box>
            <TextField
              fullWidth
              placeholder="Valor da caução"
              value={formData.depositAmount}
              disabled={!formData.hasDeposit}
              sx={!formData.hasDeposit ? desabilitarCampos :  undefined }
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  depositAmount: formatCurrencyInput(
                    event.target.value,
                    MONEY_MAX,
                  ),
                }))
              }
              inputProps={{ inputMode: "numeric" }}
              InputProps={{
                endAdornment: (
                  <Typography color={formData.hasDeposit ? "text.primary" : "text.secondary"}>
                    R$
                  </Typography>
                ),
              }}
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
                onChange={(event) => {
                  console.log(event.target.checked)
                  if (event.target.checked) {

                    setFormData((current) => ({
                      ...current,
                      hasAllowsGuests: event.target.checked,
                    }))
                  } else {
                    setFormData((current) => ({
                      ...current,
                      hasAllowsGuests: event.target.checked,
                      guestLimit: limitInteger(event.target.value, 0, GUEST_LIMIT_MAX),
                    }))

                  }
                }
                }
              />
            </Box>
            <TextField
              sx={!formData.hasAllowsGuests ? desabilitarCampos :  undefined }

              fullWidth
              placeholder="Limite de convidados"
              value={formData.guestLimit}
              disabled={!formData.hasAllowsGuests}
              onChange={(event) => {
                setFormData((current) => ({
                  ...current,
                  guestLimit: limitInteger(event.target.value, 3, GUEST_LIMIT_MAX),
                }))
              }
              }
              type="number"
              inputProps={{ min: 0, max: GUEST_LIMIT_MAX, step: 1, inputMode: "numeric" }}
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
          {imageTypes.map((type) => {
            const imageType = getEnumOptionValue(type);
            const selectedFile = formData.imageFiles[imageType];
            const previewUrl = imagePreviews[imageType];

            return (
              <Box
                key={imageType}
              >
                <ImageUploadField
                  label={getEnumOptionLabel(type)}
                  previewUrl={previewUrl}
                  fileName={selectedFile?.name}
                  height={70}
                  emptyLabel="Selecionar imagem"
                  description="Formatos aceitos: JPG, PNG."
                  onChange={(file) => handleAreaImageChange(imageType, file)}
                  sx={{
                    minHeight: "188px",
                    p: 1.5,
                    "& img": {
                      width: "100%",
                      maxWidth: 220,
                      height: "100%",
                    },
                  }}
                />
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
          width={
            formStep === areaWizardSteps.length - 1
              ? "min(980px, calc(100vw - 32px))"
              : "min(1200px, calc(100vw - 32px))"
          }
          disableContent={loading}
          actions={
            formStep === areaWizardSteps.length - 1 ? (
              <Button variant="contained" onClick={() => void handleSave()} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : "Concluir"}
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
                {activeView === "condominios" ? (
                  <Apartment sx={{ fontSize: 36, color: "#2563eb" }} />
                ) : (
                  <Pool style={{ fontSize: 36, color: "#14b8a6" }} />
                )}
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
                      setAreaPage(1);
                      setAreaTotalPages(1);
                      void loadCondominiums(condoPage);
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
            <Box sx={{ alignSelf: "stretch", pl: "48px" }}>
              <BreadcrumbTrail
                items={
                  activeView === "condominios"
                    ? ["Condominios"]
                    : [selectedCondominium?.name || "Condominios", "Áreas"]
                }
              />
            </Box>
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
                variant="condominiumSelection"
                searchPlaceholder="Buscar condominio..."
                onSearchChange={setSearchTerm}
                onAddClick={undefined}
                addButtonPlacement="toolbar"
                emptyImageLabel="Sem imagem"
                showFilters
                showPagination={condoTotalPages > 1}
                page={condoPage}
                totalPages={condoTotalPages}
                onPageChange={(nextPage) => {
                  setCondoPage(nextPage);
                  void loadCondominiums(nextPage);
                }}
                items={filteredCondominiums.map((condominium, index) => ({
                  id: condominium.condominiumId,
                  title: condominium.name,
                  subtitle: (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.35 }}>
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
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                        <Typography variant="body2" color="text.secondary">
                          {getCondominiumTypeLabel(condominium.condominiumType)}
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
                        Ver áreas
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
                title="Áreas"
                showTitle={false}
                searchPlaceholder="Buscar área..."
                onSearchChange={setSearchTerm}
                onAddClick={openCreate}
                addButtonPlacement="toolbar"
                emptyImageLabel="Sem imagem"
                showFilters
                showPagination={areaTotalPages > 1}
                imageWidth={150}
                imageHeight={108}
                cardMaxHeight="none"
                page={areaPage}
                totalPages={areaTotalPages}
                onPageChange={(nextPage) => {
                  setAreaPage(nextPage);
                  void loadAreas(selectedCondominium, nextPage);
                }}
                items={filteredAreas.map((area, index) => ({
                  id: area.areaId,
                  title: area.name,
                  subtitle: (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.35 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                        <Typography variant="body2" color="text.secondary">
                          {getTypeLabel(area.type)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                        <GroupsOutlined sx={{ fontSize: 16, color: "#14b8a6" }} />
                        <Typography variant="body2" color="text.secondary">
                          {area.capacityPeople || 0} pessoas
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                        <AccessTime sx={{ fontSize: 16, color: "#14b8a6" }} />
                        <Typography variant="body2" color="text.secondary">
                          {area.startTime} - {area.endTime}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                        <PaidOutlined sx={{ fontSize: 16, color: "#14b8a6" }} />
                        <Typography variant="body2" color="text.secondary">
                          {area.hasFee
                            ? `R$ ${formatCurrencyValue(area.feeAmount || 0)}`
                            : "Sem taxa"}
                        </Typography>
                      </Box>
                    </Box>
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
                  imageUrl: mainAreaPreviews[area.areaId],
                  accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                }))}
              />
            )}
          </Paper>
        </Paper>
      </Container>

      <AppStateModal
        showCancel={false}
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
