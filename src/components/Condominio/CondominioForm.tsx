import { AxiosError } from "axios";
import React, { useEffect, useRef, useState } from "react";
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
  Dialog,
  DialogContent,
  IconButton,
} from "@mui/material";
import {
  ApartmentOutlined,
  TuneOutlined,
  PhotoOutlined,
  AddOutlined,
  CloseOutlined,
  ImageOutlined,
} from "@mui/icons-material";
import {
  condominiumService,
  type Condominium,
  type CondominiumRequest,
  type CondominiumWithOrganizationRequest,
  type CondominiumTypeEnum,
  type PhysicalStructureEnum,
} from "../../services/condominiumService";
import {
  condominiumImageService,
  type ImageType,
  type ImageTypeEnum,
} from "../../services/condominiumImageService";
import { organizationService } from "../../services/organizationService";
import { AppStateModal } from "../../shared/components/AppStateModal";
import ImageUploadField from "../../shared/components/ImageUploadField";
import StepWizardCard from "../../shared/components/StepWizardCard";
import { desabilitarCampos } from "../../shared/utils/desabilitarCampos";
import { useAppStateModal } from "../../shared/utils/useAppStateModal";
import { useTranslation } from "react-i18next";

interface CondominioFormProps {
  open: boolean;
  editingCondominium: Condominium | null;
  onClose: () => void;
  imageSelected: null | string;
  onSaved: () => void | Promise<void>;
  condominiumTypes: CondominiumTypeEnum[];
  physicalStructureTypes: PhysicalStructureEnum[];
  typesLoading: boolean;
  physicalStructuresLoading: boolean;
  typesError: string | null;
  physicalStructuresError: string | null;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  firstAccessMode?: boolean;
  createWithOrganizationOrgType?: number | string;
  onCreated?: (payload: { condominiumId: string; label: string }) => void;
  onCompleted?: () => void;
}

type ImageUploadItem = {
  id: string;
  file: File | null;
  imageType: ImageType;
  label: string;
  preview: string;
};

const DEFAULT_PHYSICAL_STRUCTURES: PhysicalStructureEnum[] = [
  { id: 1, value: "Vertical", description: "Vertical" },
  { id: 2, value: "Horizontal", description: "Horizontal" },
  { id: 3, value: "Mixed", description: "Misto" },
];

const EXCLUDED_OTHER_IMAGE_TYPES = new Set([
  "Complementary",
  "Facade",
  "Thumbnail",
  "Banner",
  "Logo",
]);

const CondominioForm: React.FC<CondominioFormProps> = ({
  open,
  editingCondominium,
  onClose,
  imageSelected,
  onSaved,
  condominiumTypes,
  physicalStructureTypes,
  typesLoading,
  physicalStructuresLoading,
  typesError,
  physicalStructuresError,
  loading,
  setLoading,
  firstAccessMode = false,
  createWithOrganizationOrgType,
  onCreated,
  onCompleted,
}) => {
  const { t } = useTranslation();
  const { appStateModal, handleClose, showSuccess, showError } =
    useAppStateModal();
  const [closeAfterModal, setCloseAfterModal] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageTypes, setImageTypes] = useState<ImageTypeEnum[]>([]);
  const [imageTypesLoading, setImageTypesLoading] = useState(false);
  const [imageTypesError, setImageTypesError] = useState<string | null>(null);
  const [imageTypeDialogOpen, setImageTypeDialogOpen] = useState(false);
  const [selectedOtherImageType, setSelectedOtherImageType] =
    useState<ImageTypeEnum | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [facadeFile, setFacadeFile] = useState<File | null>(null);
  const [facadePreview, setFacadePreview] = useState<string | null>(null);
  const [otherImages, setOtherImages] = useState<ImageUploadItem[]>([]);
  const otherFileInputRef = useRef<HTMLInputElement | null>(null);

  const initialFormData: CondominiumRequest = {
    organizationId: localStorage.getItem("organizationId") || "",
    name: "",
    doc: "",
    email: "",
    phone: "",
    mobilePhone: "",
    address: "",
    addressNumber: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    condominiumType: "",
    physicalStructureId: "",
    unitCount: 0,
    hasBlocks: false,
    hasWaterIndividual: false,
    hasPowerByBlock: false,
    hasGasByBlock: false,
    commit: true,
  };

  const [formData, setFormData] = useState<CondominiumRequest>(initialFormData);
  const [addressFieldsDisabled, setAddressFieldsDisabled] = useState({
    address: true,
    neighborhood: true,
    city: true,
    state: true,
    addressNumber: true,
    complement: true,
  });

  const steps = ["Informacões Básicas", "Endereço", "Configurações do Condomínio"];
  const effectivePhysicalStructures =
    physicalStructureTypes.length > 0
      ? physicalStructureTypes
      : DEFAULT_PHYSICAL_STRUCTURES;
  const otherImageTypeOptions = imageTypes.filter(
    (type) => !EXCLUDED_OTHER_IMAGE_TYPES.has(type.value),
  );

  const toImagePreviewUrl = (contentType?: string, contentFile?: string) =>
    contentType && contentFile
      ? `data:${contentType};base64,${contentFile}`
      : null;

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length === 0) return "";
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return numbers.replace(/(\d{2})(\d+)/, "$1.$2");
    if (numbers.length <= 8)
      return numbers.replace(/(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
    if (numbers.length <= 12)
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, "$1.$2.$3/$4");
    return numbers.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/,
      "$1.$2.$3/$4-$5",
    );
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return numbers.replace(/(\d{2})(\d+)/, "($1) $2");
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d+)/, "($1) $2-$3");
    }
    return numbers.replace(/(\d{2})(\d{5})(\d+)/, "($1) $2-$3");
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length === 0) return "";
    if (numbers.length <= 5) return numbers;
    return numbers.replace(/(\d{5})(\d+)/, "$1-$2");
  };

  const validateCnpj = (value: string) => {
    const cnpj = value.replace(/\D/g, "");
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

    const validateDigit = (size: number) => {
      const numbers = cnpj.substring(0, size);
      const digit = parseInt(cnpj.charAt(size), 10);
      let sum = 0;
      let pos = size - 7;

      for (let i = size; i >= 1; i -= 1) {
        sum += parseInt(numbers.charAt(size - i), 10) * pos;
        pos -= 1;
        if (pos < 2) pos = 9;
      }

      const result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      return result === digit;
    };

    return validateDigit(12) && validateDigit(13);
  };

  const isValidEmail = (value: string) =>
    /^[^\s@]+@(?:[^\s@.]+\.)+[^\s@.]{2,}$/.test(value.trim());

  const normalizeCondominiumTypeValue = (value: string | number) => {
    const match = condominiumTypes.find(
      (type) => type.id === value || type.value === value,
    );
    return match?.id ?? value;
  };

  const normalizePhysicalStructureValue = (value: string | number) => {
    const match = effectivePhysicalStructures.find(
      (type) => type.id === value || type.value === value,
    );
    return match?.id ?? value;
  };

  const revokePreview = (preview?: string | null) => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
  };

  const resetImages = () => {
    revokePreview(documentPreview);
    revokePreview(facadePreview);
    otherImages.forEach((item) => revokePreview(item.preview));
    setDocumentFile(null);
    setDocumentPreview(null);
    setFacadeFile(null);
    setFacadePreview(null);
    setOtherImages([]);
    setSelectedOtherImageType(null);
    setImageTypeDialogOpen(false);
  };

  const ensureOrganizationId = async () => {
    let organizationId = localStorage.getItem("organizationId") || "";
    if (!organizationId) {
      organizationId = (await organizationService.getMyOrganizationId()) || "";
      localStorage.setItem("organizationId", organizationId);
    }
    if (organizationId) {
      setFormData((prev) => ({ ...prev, organizationId }));
    }
  };

  const loadImageTypes = async () => {
    setImageTypesLoading(true);
    setImageTypesError(null);
    try {
      const data = await condominiumImageService.getImageTypes();
      setImageTypes(data ?? []);
    } catch (error) {
      setImageTypesError(error instanceof Error ? error.message : "Erro ao carregar tipos de imagem.");
    } finally {
      setImageTypesLoading(false);
    }
  };

  useEffect(() => {
    loadImageTypes();
  }, []);

  const loadExistingImages = async (condominiumId: string) => {
    if (imageTypes.length === 0) return;

    const requestedTypes = imageTypes.map((type) => type.value as ImageType);
    const imageLists = await Promise.all(
      requestedTypes.map(async (imageType) => {
        try {
          const images = await condominiumImageService.getCondominiumImages(
            condominiumId,
            imageType,
          );
          return images.map((image) => ({ ...image, imageType }));
        } catch {
          return [];
        }
      }),
    );

    const imageDetails = await Promise.all(
      imageLists.flat().map(async (image) => {
        try {
          const detail = await condominiumImageService.getCondominiumImageById(
            image.condominiumImageId,
          );
          return {
            imageType: image.imageType,
            detail,
          };
        } catch {
          return null;
        }
      }),
    );

    const loadedOtherImages: ImageUploadItem[] = [];
    let loadedDocumentPreview: string | null = null;
    let loadedFacadePreview: string | null = null;

    imageDetails.forEach((item) => {
      if (!item) return;
      const preview = toImagePreviewUrl(
        item.detail.contentType,
        item.detail.contentFile,
      );
      if (!preview) return;

      if (item.imageType === "Complementary") {
        loadedDocumentPreview ??= preview;
        return;
      }

      if (item.imageType === "Facade") {
        loadedFacadePreview ??= preview;
        return;
      }

      if (EXCLUDED_OTHER_IMAGE_TYPES.has(item.imageType)) return;

      const imageType = imageTypes.find((type) => type.value === item.imageType);
      loadedOtherImages.push({
        id: item.detail.condominiumImageId,
        file: null,
        imageType: item.imageType,
        label: imageType?.description || item.imageType,
        preview,
      });
    });

    setDocumentPreview(loadedDocumentPreview);
    setFacadePreview(loadedFacadePreview ?? imageSelected);
    setOtherImages(loadedOtherImages);
  };

  useEffect(() => {
    if (!open) return;
    setActiveStep(0);
    setErrors({});
    setCepError(null);
    ensureOrganizationId();
    resetImages();
    setAddressFieldsDisabled({
      address: true,
      neighborhood: true,
      city: true,
      state: true,
      addressNumber: true,
      complement: true,
    });

    if (editingCondominium) {
      setEditingId(editingCondominium.condominiumId);
      setFormData({
        organizationId: editingCondominium.organizationId,
        name: editingCondominium.name,
        doc: formatCNPJ(editingCondominium.doc || ""),
        email: editingCondominium.email || "",
        phone: formatPhone(editingCondominium.phone || ""),
        mobilePhone: formatPhone(editingCondominium.mobilePhone || ""),
        address: editingCondominium.address,
        addressNumber: editingCondominium.addressNumber,
        complement: editingCondominium.complement || "",
        neighborhood: editingCondominium.neighborhood,
        city: editingCondominium.city,
        state: editingCondominium.state,
        zipCode: formatCEP(editingCondominium.zipCode || ""),
        condominiumType: normalizeCondominiumTypeValue(editingCondominium.condominiumType),
        physicalStructureId: normalizePhysicalStructureValue(
          editingCondominium.physicalStructureId || "",
        ),
        unitCount: editingCondominium.unitCount ?? 0,
        hasBlocks: editingCondominium.hasBlocks,
        hasWaterIndividual: editingCondominium.hasWaterIndividual,
        hasPowerByBlock: editingCondominium.hasPowerByBlock,
        hasGasByBlock: editingCondominium.hasGasByBlock,
        commit: true,
      });
      void loadExistingImages(editingCondominium.condominiumId);
      return;
    }

    setEditingId(null);
    setFormData({
      ...initialFormData,
      organizationId: localStorage.getItem("organizationId") || "",
    });
    setFacadePreview(imageSelected);
  }, [open, editingCondominium, imageSelected, condominiumTypes, physicalStructureTypes, imageTypes]);

  useEffect(() => () => resetImages(), []);

  if (!open) return null;

  const handleChange = (field: string, value: unknown) => {
    let processedValue = value;
    if (field === "doc") processedValue = formatCNPJ(String(value));
    if (field === "phone" || field === "mobilePhone") {
      processedValue = formatPhone(String(value));
    }
    if (field === "zipCode") processedValue = formatCEP(String(value));
    setFormData((prev) => ({ ...prev, [field]: processedValue }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateStep0 = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = t("condominioForm.nameRequired");
    if (!validateCnpj(formData.doc)) {
      nextErrors.doc = t("condominioForm.cnpjInvalid");
    }
    if (!formData.email.trim()) {
      nextErrors.email = t("validation.emailRequired");
    } else if (!isValidEmail(formData.email)) {
      nextErrors.email = t("validation.emailInvalid");
    }
    return nextErrors;
  };

  const validateStep1 = () => {
    const nextErrors: Record<string, string> = {};
    if (formData.zipCode.replace(/\D/g, "").length !== 8) {
      nextErrors.zipCode = t("condominioForm.zipInvalid");
    }
    if (!formData.address.trim()) nextErrors.address = t("condominioForm.addressRequired");
    if (!formData.addressNumber.trim()) {
      nextErrors.addressNumber = t("condominioForm.addressNumberRequired");
    }
    if (!formData.neighborhood.trim()) {
      nextErrors.neighborhood = t("condominioForm.neighborhoodRequired");
    }
    if (!formData.city.trim()) nextErrors.city = t("condominioForm.cityRequired");
    if (formData.state.trim().length !== 2) {
      nextErrors.state = t("condominioForm.stateInvalid");
    }
    return nextErrors;
  };

  const validateStep2 = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.condominiumType) {
      nextErrors.condominiumType = t("condominioForm.typeRequired");
    }
    if (!formData.physicalStructureId) {
      nextErrors.physicalStructureId =
        t("condominioForm.physicalStructureRequired", {
          defaultValue: "Selecione a estrutura fisica.",
        });
    }
    return nextErrors;
  };

  const fieldMap: Record<string, keyof CondominiumRequest> = {
    organizationid: "organizationId",
    orgtype: "organizationId",
    name: "name",
    doc: "doc",
    email: "email",
    phone: "phone",
    mobilephone: "mobilePhone",
    address: "address",
    addressnumber: "addressNumber",
    complement: "complement",
    neighborhood: "neighborhood",
    city: "city",
    state: "state",
    zipcode: "zipCode",
    condominiumtype: "condominiumType",
    physicalstructureid: "physicalStructureId",
    unitcount: "unitCount",
    hasblocks: "hasBlocks",
    haswaterindividual: "hasWaterIndividual",
    haspowerbyblock: "hasPowerByBlock",
    hasgasbyblock: "hasGasByBlock",
    commit: "commit",
  };

  const stepFields: Array<Array<keyof CondominiumRequest>> = [
    ["organizationId", "name", "doc", "email", "phone", "mobilePhone"],
    ["zipCode", "address", "addressNumber", "neighborhood", "city", "state", "complement"],
    [
      "condominiumType",
      "physicalStructureId",
      "hasBlocks",
      "hasWaterIndividual",
      "hasPowerByBlock",
      "hasGasByBlock",
    ],
  ];

  const mapBackendValidationErrors = (
    validations: Array<{ field: string; message: string }>,
    onlyStep?: number,
  ) => {
    const nextErrors: Record<string, string> = {};
    let targetStep = 0;
    validations.forEach((validation) => {
      const key = validation.field?.replace(/\s+/g, "").toLowerCase();
      const field = key ? fieldMap[key] : undefined;
      if (!field) return;
      const stepIndex = stepFields.findIndex((fields) => fields.includes(field));
      if (typeof onlyStep === "number" && stepIndex !== onlyStep) return;
      nextErrors[field] = validation.message;
      if (stepIndex >= 0) targetStep = Math.max(targetStep, stepIndex);
    });
    return { nextErrors, targetStep };
  };

  const buildPayload = (commit: boolean): CondominiumRequest => ({
    ...formData,
    doc: formData.doc.replace(/\D/g, ""),
    phone: formData.phone?.replace(/\D/g, ""),
    mobilePhone: formData.mobilePhone?.replace(/\D/g, ""),
    zipCode: formData.zipCode.replace(/\D/g, ""),
    condominiumType: normalizeCondominiumTypeValue(formData.condominiumType),
    physicalStructureId: normalizePhysicalStructureValue(formData.physicalStructureId || ""),
    commit,
  });

  const buildWithOrganizationPayload = (
    commit: boolean,
  ): CondominiumWithOrganizationRequest => {
    const { organizationId: _organizationId, ...payload } = buildPayload(commit);
    return {
      ...payload,
      orgType: createWithOrganizationOrgType || "",
    };
  };

  const shouldCreateWithOrganization =
    firstAccessMode && !!createWithOrganizationOrgType && !editingId;

  const handleNext = async () => {
    const localErrors = activeStep === 0 ? validateStep0() : validateStep1();
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }
    try {
      setLoading(true);
      const payload = buildPayload(false);
      const { valid, validations } = shouldCreateWithOrganization
        ? await condominiumService.validateCondominiumWithOrganization(
            buildWithOrganizationPayload(false),
          )
        : editingId
          ? await condominiumService.validateCondominiumEdit(
              payload,
              editingCondominium?.condominiumId || "",
            )
          : await condominiumService.validateCondominium(payload);
      if (!valid && validations.length > 0) {
        const { nextErrors } = mapBackendValidationErrors(validations, activeStep);
        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          return;
        }
      }
    } catch (error) {
      showError(
        error instanceof Error ? error.message : t("condominioForm.validationError"),
      );
      return;
    } finally {
      setLoading(false);
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleCepLookup = async () => {
    const cepDigits = formData.zipCode.replace(/\D/g, "");
    if (cepDigits.length !== 8) {
      setCepError(null);
      return;
    }
    setCepLoading(true);
    setCepError(null);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await response.json();
      if (data?.erro) {
        setCepError(t("condominioForm.cepNotFound"));
        setAddressFieldsDisabled({
          address: false,
          neighborhood: false,
          city: false,
          state: false,
          addressNumber: false,
          complement: false,
        });
        return;
      }
      setFormData((prev) => ({
        ...prev,
        address: data.logradouro || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
      }));
      setAddressFieldsDisabled({
        address: !!data.logradouro,
        neighborhood: !!data.bairro,
        city: !!data.localidade,
        state: !!data.uf,
        addressNumber: false,
        complement: false,
      });
    } catch (error) {
      setCepError(error instanceof Error ? error.message : t("condominioForm.cepError"));
      setAddressFieldsDisabled({
        address: false,
        neighborhood: false,
        city: false,
        state: false,
        addressNumber: false,
        complement: false,
      });
    } finally {
      setCepLoading(false);
    }
  };



  const handleDocumentFileChange = (file: File | null) => {
    revokePreview(facadePreview);
    if (!file) {
    setDocumentFile(file);
      setDocumentPreview(null);
      return;
    }

    setDocumentFile(file);
    setDocumentPreview(URL.createObjectURL(file));
  };
  const handleFacadeImageChange = (file: File | null) => {
    revokePreview(facadePreview);
    if (!file) {
      setFacadeFile(null);
      setFacadePreview(null);
      return;
    }

    setFacadeFile(file);
    setFacadePreview(URL.createObjectURL(file));
  };

  const handleOtherFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedOtherImageType) return;
    setOtherImages((prev) => [
      ...prev,
      {
        id: `${selectedOtherImageType.value}-${Date.now()}`,
        file,
        imageType: selectedOtherImageType.value,
        label: selectedOtherImageType.description || selectedOtherImageType.value,
        preview: URL.createObjectURL(file),
      },
    ]);
    setSelectedOtherImageType(null);
    event.target.value = "";
  };

  const handleSelectOtherImageType = (type: ImageTypeEnum) => {
    setSelectedOtherImageType(type);
    setImageTypeDialogOpen(false);
    setTimeout(() => otherFileInputRef.current?.click(), 0);
  };

  const handleRemoveOtherImage = (id: string) => {
    setOtherImages((prev) => {
      const match = prev.find((item) => item.id === id);
      if (match) revokePreview(match.preview);
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleReplaceOtherImage = (id: string, file: File | null) => {
    if (!file) {
      handleRemoveOtherImage(id);
      return;
    }

    setOtherImages((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        revokePreview(item.preview);
        return {
          ...item,
          file,
          preview: URL.createObjectURL(file),
        };
      }),
    );
  };

  const uploadImages = async (condominiumId: string) => {
    if (documentFile) {
      await condominiumImageService.uploadCondominiumImage({
        imageType: "Complementary",
        contentFile: documentFile,
        condominiumId,
      });
    }
    if (facadeFile) {
      await condominiumImageService.uploadCondominiumImage({
        imageType: "Facade",
        contentFile: facadeFile,
        condominiumId,
      });
    }
    for (const image of otherImages) {
      if (!image.file) continue;
      await condominiumImageService.uploadCondominiumImage({
        imageType: image.imageType,
        contentFile: image.file,
        condominiumId,
      });
    }
  };

  const handleSubmit = async () => {
    const step2Errors = validateStep2();
    if (Object.keys(step2Errors).length > 0) {
      setErrors(step2Errors);
      return;
    }
    if (!shouldCreateWithOrganization && !formData.organizationId.trim()) return;

    try {
      setLoading(true);
      const payload = buildPayload(true);
      const { valid, validations } = shouldCreateWithOrganization
        ? await condominiumService.validateCondominiumWithOrganization(
            buildWithOrganizationPayload(false),
          )
        : editingId
          ? await condominiumService.validateCondominiumEdit(
              { ...payload, commit: false },
              editingCondominium?.condominiumId || "",
            )
          : await condominiumService.validateCondominium({
              ...payload,
              commit: false,
            });

      if (!valid && validations.length > 0) {
        const { nextErrors, targetStep } = mapBackendValidationErrors(validations);
        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          setActiveStep(targetStep);
          return;
        }
      }

      const response = shouldCreateWithOrganization
        ? await condominiumService.createCondominiumWithOrganization(
            buildWithOrganizationPayload(true),
          )
        : editingId
          ? await condominiumService.updateCondominium(editingId, payload)
          : await condominiumService.createCondominium(payload);
      const condominiumId = response || editingId || "";
      if (condominiumId) await uploadImages(condominiumId);

      if (!editingId && condominiumId) {
        onCreated?.({
          condominiumId,
          label: formData.name.trim(),
        });
      }

      showSuccess(
        editingId
          ? t("condominioForm.updateSuccess", { name: formData.name })
          : t("condominioForm.createSuccess", { name: formData.name }),
      );

      setCloseAfterModal(true);
      if (!firstAccessMode) {
        handleCloseWizard(false);
      }
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 422) {
        setErrors({ doc: t("condominioForm.duplicateCnpj") });
        setActiveStep(0);
      } else {
        showError(
          error instanceof Error
            ? error.message
            : editingId
              ? t("condominioForm.updateError")
              : t("condominioForm.createError"),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = async () => {
    handleClose();
    await onSaved();
    if (closeAfterModal) {
      setCloseAfterModal(false);
      if (!firstAccessMode) {
        onClose();
      } else {
        onCompleted?.();
      }
    }
  };

  const handleCloseWizard = (propagate = true) => {
    setEditingId(null);
    setActiveStep(0);
    setFormData({
      ...initialFormData,
      organizationId: localStorage.getItem("organizationId") || "",
    });
    setErrors({});
    setCepError(null);
    resetImages();
    if (propagate) onClose();
  };

  const renderStepContent = (step: number) => {
    if (step === 0) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
          <TextField value={formData.name} onChange={(e) => handleChange("name", e.target.value)} error={!!errors.name} helperText={errors.name} placeholder={t("condominioForm.namePlaceholder")} />
          <TextField value={formData.doc} onChange={(e) => handleChange("doc", e.target.value)} error={!!errors.doc} helperText={errors.doc} placeholder="CNPJ" />
          <TextField value={formData.email} onChange={(e) => handleChange("email", e.target.value)} error={!!errors.email} helperText={errors.email} placeholder="E-mail" />
          <TextField value={formData.phone || ""} onChange={(e) => handleChange("phone", e.target.value)} error={!!errors.phone} helperText={errors.phone} placeholder="Telefone" />
          <TextField value={formData.mobilePhone || ""} onChange={(e) => handleChange("mobilePhone", e.target.value)} error={!!errors.mobilePhone} helperText={errors.mobilePhone} placeholder="Celular" />
        </Box>
      );
    }

    if (step === 1) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
          <TextField value={formData.zipCode} onChange={(e) => handleChange("zipCode", e.target.value)} onBlur={handleCepLookup} error={!!errors.zipCode || !!cepError} helperText={errors.zipCode || cepError} placeholder="CEP" inputProps={{ maxLength: 9 }} InputProps={{ endAdornment: cepLoading ? <CircularProgress size={18} /> : null }} />
          <TextField disabled={addressFieldsDisabled.address} sx={addressFieldsDisabled.address ? desabilitarCampos : {}} value={formData.address} onChange={(e) => handleChange("address", e.target.value)} error={!!errors.address} helperText={errors.address} placeholder="Logradouro" />
          <TextField disabled={addressFieldsDisabled.neighborhood} sx={addressFieldsDisabled.neighborhood ? desabilitarCampos : {}} value={formData.neighborhood} onChange={(e) => handleChange("neighborhood", e.target.value)} error={!!errors.neighborhood} helperText={errors.neighborhood} placeholder="Bairro" />
          <TextField disabled={addressFieldsDisabled.city} sx={addressFieldsDisabled.city ? desabilitarCampos : {}} value={formData.city} onChange={(e) => handleChange("city", e.target.value)} error={!!errors.city} helperText={errors.city} placeholder="Cidade" />
          <TextField disabled={addressFieldsDisabled.state} sx={addressFieldsDisabled.state ? desabilitarCampos : {}} value={formData.state} onChange={(e) => handleChange("state", e.target.value.toUpperCase())} error={!!errors.state} helperText={errors.state} placeholder="UF" inputProps={{ maxLength: 2 }} />
          <TextField disabled={addressFieldsDisabled.addressNumber} sx={addressFieldsDisabled.addressNumber ? desabilitarCampos : {}} value={formData.addressNumber} onChange={(e) => handleChange("addressNumber", e.target.value)} error={!!errors.addressNumber} helperText={errors.addressNumber} placeholder="Numero" />
          <TextField disabled={addressFieldsDisabled.complement} sx={addressFieldsDisabled.complement ? desabilitarCampos : {}} value={formData.complement || ""} onChange={(e) => handleChange("complement", e.target.value)} error={!!errors.complement} helperText={errors.complement} placeholder="Complemento" />
        </Box>
      );
    }

    const previewFacade = facadePreview ?? imageSelected ?? undefined;
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <Box sx={{ border: "1px solid #e2e8f0", borderRadius: "12px", p: '6px', height: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ApartmentOutlined sx={{ color: "#2563eb", fontSize: 20 }} />
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Estrutura do Condomínio</Typography>
              </Box>
              <Box sx={{ borderBottom: "1px solid #e2e8f0", mb: 1.25 }} />
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", }}>
                <FormControlLabel control={<Checkbox checked={formData.hasBlocks} onChange={(e) => handleChange("hasBlocks", e.target.checked)} size="small" />} label="Possui blocos" />
                <FormControlLabel control={<Checkbox checked={formData.hasPowerByBlock} onChange={(e) => handleChange("hasPowerByBlock", e.target.checked)} size="small" />} label="Energia por bloco" />
                <FormControlLabel control={<Checkbox checked={formData.hasGasByBlock} onChange={(e) => handleChange("hasGasByBlock", e.target.checked)} size="small" />} label="Gas por bloco" />
                <FormControlLabel control={<Checkbox checked={formData.hasWaterIndividual} onChange={(e) => handleChange("hasWaterIndividual", e.target.checked)} size="small" />} label="Medicao individual de agua" />
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ border: "1px solid #e2e8f0", borderRadius: "12px", p: '6px', height: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TuneOutlined sx={{ color: "#16a34a", fontSize: 20 }} />
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Configurações do Condomínio</Typography>
              </Box>
              <Box sx={{ borderBottom: "1px solid #e2e8f0", mb: 1.25 }} />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                <TextField select size="small" value={formData.condominiumType || ""} onChange={(e) => handleChange("condominiumType", normalizeCondominiumTypeValue(e.target.value))} error={!!errors.condominiumType} helperText={errors.condominiumType || typesError}>
                  <MenuItem value="" disabled><em>Selecione o tipo de condominio</em></MenuItem>
                  {typesLoading ? <MenuItem value={formData.condominiumType} disabled>{t("common.loading")}</MenuItem> : condominiumTypes.map((type) => <MenuItem key={type.id} value={type.id}>{type.description || type.value}</MenuItem>)}
                </TextField>
                <TextField select size="small" value={formData.physicalStructureId || ""} onChange={(e) => handleChange("physicalStructureId", normalizePhysicalStructureValue(e.target.value))} error={!!errors.physicalStructureId} helperText={errors.physicalStructureId || physicalStructuresError}>
                  <MenuItem value="" disabled><em>Selecione a estrutura fisica</em></MenuItem>
                  {physicalStructuresLoading ? <MenuItem value={formData.physicalStructureId} disabled>{t("common.loading")}</MenuItem> : effectivePhysicalStructures.map((type) => <MenuItem key={type.id} value={type.id}>{type.description || type.value}</MenuItem>)}
                </TextField>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ border: "1px solid #e2e8f0", borderRadius: "12px", p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PhotoOutlined sx={{ color: "#4f46e5", fontSize: 20 }} />
            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Imagens do Condominio</Typography>
          </Box>
          <Box sx={{ borderBottom: "1px solid #e2e8f0", mb: 1.5 }} />
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={4}>
              <ImageUploadField
                label="Documento"
                previewUrl={documentPreview}
                fileName={documentFile?.name}
                height={140}
                emptyLabel="Selecionar arquivo"
                description="Formatos aceitos: JPG, PNG."
                onChange={handleDocumentFileChange}
                sx={{ minHeight: 220 }}
              />

              </Grid>
            <Grid item xs={12} md={4} >
              <ImageUploadField
                label="Fachada"
                previewUrl={previewFacade}
                fileName={facadeFile?.name}
                height={140}
                emptyLabel="Selecionar imagem"
                description="Formatos aceitos: JPG, PNG."
                onChange={handleFacadeImageChange}
                sx={{ minHeight: 220 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ border: "1px solid #e2e8f0", borderRadius: "12px", p: 1.5,height:'100%', maxHeight:220, overflowY:'auto' }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Outros</Typography>
                  <IconButton size="small" onClick={() => setImageTypeDialogOpen(true)} disabled={imageTypesLoading}><AddOutlined /></IconButton>
                </Box>
                <Box sx={{ display:'flex', flexDirection:'column',gap: 1 }}>
                                    {otherImages.map((image) => (
                    <ImageUploadField
                      key={image.id}
                      label={image.label}
                      previewUrl={image.preview}
                      fileName={image.file?.name}
                      height={84}
                      showTitle={false}
                      description=""
                      changeLabel="Trocar"
                      onChange={(file) => handleReplaceOtherImage(image.id, file)}
                    />
                  ))}

                </Box>
                {imageTypesError ? <Typography sx={{ color: "#d32f2f", fontSize: 12, mt: 1 }}>{imageTypesError}</Typography> : null}
              </Box>
            </Grid>
          </Grid>
          <input ref={otherFileInputRef} hidden type="file" accept="image/*" onChange={handleOtherFileChange} />
        </Box>
      </Box>
    );
  };

  return (
    <>
      <StepWizardCard
        title={editingId ? t("condominioForm.editTitle") : t("condominioForm.createTitle")}
        subtitle={steps[activeStep]}
        steps={steps}
        onClose={() => handleCloseWizard()}
        activeStep={activeStep}
        showBack={activeStep > 0 && activeStep < steps.length}
        onBack={handleBack}
        width={activeStep === 2 ? "1200px" : "650px"}
        disableContent={loading}
        actions={
          activeStep === steps.length - 1 ? (
            <Button sx={{ textTransform: "none" }} variant="contained" color="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : t("common.finish")}
            </Button>
          ) : (
            <Button sx={{ textTransform: "none" }} variant="contained" onClick={handleNext} disabled={loading}>
              {t("common.next")}
            </Button>
          )
        }
      >
        <div className="condominio-form">{renderStepContent(activeStep)}</div>
      </StepWizardCard>

      <Dialog open={imageTypeDialogOpen} onClose={() => setImageTypeDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography sx={{ fontSize: 22, fontWeight: 600 }}>Selecione o tipo de imagem</Typography>
            <IconButton onClick={() => setImageTypeDialogOpen(false)}>
              <CloseOutlined />
            </IconButton>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 1.5 }}>
            {otherImageTypeOptions.map((type) => (
              <Box
                key={type.id}
                onClick={() => handleSelectOtherImageType(type)}
                sx={{
                  border: "1px dashed #cbd5e1",
                  borderRadius: "16px",
                  p: 2,
                  minHeight: 125,
                  cursor: "pointer",
                  "&:hover": { borderColor: "#2563eb", boxShadow: "0 10px 24px rgba(37,99,235,0.08)" },
                }}
              >
                <Box sx={{ width: 42, height: 42, borderRadius: "50%", border: "1px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", ml: "auto", mb: 2 }}>
                  <AddOutlined />
                </Box>
                <ImageOutlined sx={{ fontSize: 40, color: "#2563eb", mb: 1.5 }} />
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{type.description || type.value}</Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>

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

export default CondominioForm;
