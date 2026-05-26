import { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Checkbox,
  CircularProgress,
  Grid,
} from "@mui/material";
import {
  AccountBalanceWallet,
  CameraAlt,
  EventAvailable,
  HowToVote,
  MeetingRoom,
  RuleSharp,
} from "@mui/icons-material";
import {
  unitResidentService,
  type CondominiumUnitResident,
  type CondominiumUnitResidentRequest,
} from "../../services/unitResidentService";
import type { CondominiumUnit, UnitType } from "../../services/unitService";
import { AppStateModal } from "../../shared/components/AppStateModal";
import ImageUploadField from "../../shared/components/ImageUploadField";
import StepWizardCard from "../../shared/components/StepWizardCard";
import { useAppStateModal } from "../../shared/utils/useAppStateModal";
import { AccountService } from "../../services/accountService";
import { condominiumUnitImageService } from "../../services/condominiumUnitImageService";
import moment from "moment";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ptBR } from "date-fns/locale";
import { AuthService } from "../../services/authService";
import { TokenService } from "../../services/tokenService";
import { useTranslation } from "react-i18next";
import type { AccountResponse, TypesDoc } from "../../models/api.model";
import { formatDoc } from "../../shared/utils/funcoes";

interface ResidenteFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  condominiumIdPreset?: string;
  condominiumNamePreset?: string;
  blockNamePreset?: string;
  unitIdPreset?: string;
  unitCodePreset?: string;
  unitOptions?: CondominiumUnit[];
  editResident?: CondominiumUnitResident | null;
  editUserId?: string;
  residentImageUrl?: string; // NOVA PROP
  unit?: 1 | 2 | "1" | "2" | string | undefined;
  firstAccessMode?: boolean;
  onCreated?: (payload: { residentId: any; userId: string; label: string }) => void;
  onCompleted?: () => void;
}

type DocumentType = 1 | 2 | 3 | 4;

const base64PreviewToFile = (
  preview: string,
  fileName: string,
  fallbackType = "image/jpeg",
) => {
  const dataUrlMatch = preview.match(/^data:([^;]+);base64,(.+)$/);
  const contentType = dataUrlMatch?.[1] || fallbackType;
  const base64Content = dataUrlMatch?.[2] || preview;

  try {
    const binary = atob(base64Content);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return new File([bytes], fileName, { type: contentType });
  } catch {
    return null;
  }
};

const formatCpf = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return digits.replace(/(\d{3})(\d+)/, "$1.$2");
  if (digits.length <= 9) {
    return digits.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  }
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, "$1.$2.$3-$4");
};

const formatCnpj = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return digits.replace(/(\d{2})(\d+)/, "$1.$2");
  if (digits.length <= 8)
    return digits.replace(/(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
  if (digits.length <= 12)
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, "$1.$2.$3/$4");
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, "$1.$2.$3/$4-$5");
};

const validateCnpj = (cnpj: string) => {
  const cnpjClean = cnpj.replace(/\D/g, "");

  if (cnpjClean.length !== 14 || /^(\d)\1+$/.test(cnpjClean)) {
    return false;
  }

  let size = cnpjClean.length - 2;
  let numbers = cnpjClean.substring(0, size);
  const digits = cnpjClean.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0), 10)) {
    return false;
  }

  size = size + 1;
  numbers = cnpjClean.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1), 10)) {
    return false;
  }

  return true;
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return digits.replace(/(\d{2})(\d+)/, "($1) $2");
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d+)/, "($1) $2-$3");
  }
  return digits.replace(/(\d{2})(\d{5})(\d+)/, "($1) $2-$3");
};

const normalizePhoneToE164 = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return `+${digits}`;
  return `+55${digits}`;
};

const parseDatePickerValue = (value?: string | null) => {
  if (!value) return null;

  const parsed = moment(
    value,
    [moment.ISO_8601, "YYYY-MM-DD", "DD/MM/YYYY"],
    true,
  );

  return parsed.isValid() ? parsed.toDate() : null;
};

const ResidenteForm: React.FC<ResidenteFormProps> = ({
  open,
  onClose,
  onSaved,
  loading,
  setLoading,
  condominiumIdPreset,
  condominiumNamePreset,
  blockNamePreset,
  unitIdPreset,
  unitCodePreset,
  unitOptions = [],
  editResident,
  editUserId,
  residentImageUrl,
  unit,
  firstAccessMode = false,
  onCreated,
  onCompleted,
}) => {
  const { t } = useTranslation();
  const { appStateModal, handleClose, showSuccess, showError } =
    useAppStateModal();
  const [closeAfterModal, setCloseAfterModal] = useState(false);
  const STEPS = [
    t("residenteForm.stepPeriod"),
    t("residenteForm.stepData"),
    t("residenteForm.stepPermissions"),
  ];
  const [formData, setFormData] = useState<CondominiumUnitResidentRequest>({
    condominiumUnitId: unitIdPreset || "",
    userId: "",
    fullname: "",
    docType: 1,
    doc: "",
    email: "",
    phone: "",
    unitType: "Owner",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    billingContact: false,
    canVote: false,
    canMakeReservations: false,
    hasGatehouseAccess: false,
  });

  const [createdUserId, setCreatedUserId] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeStep, setActiveStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>(1);
  const [documentNumber, setDocumentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [documentPhotoFile, setDocumentPhotoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [documentPhotoPreview, setDocumentPhotoPreview] = useState<
    string | null
  >(null);
  const isEditMode = Boolean(editResident);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(coverFile);
    setCoverPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [coverFile]);

  useEffect(() => {
    if (!documentPhotoFile) {
      setDocumentPhotoPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(documentPhotoFile);
    setDocumentPhotoPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [documentPhotoFile]);

  useEffect(() => {
    if (coverPreview && !coverFile) {
      const previewFile = base64PreviewToFile(
        coverPreview,
        "resident-profile.jpg",
      );

      if (previewFile) {
        setCoverFile(previewFile);
        setPhotoFile(previewFile);
      }
    }

    if (documentPhotoPreview && !documentPhotoFile) {
      const previewFile = base64PreviewToFile(
        documentPhotoPreview,
        "resident-document.jpg",
      );

      if (previewFile) {
        setDocumentPhotoFile(previewFile);
      }
    }
  }, [coverFile, coverPreview, documentPhotoFile, documentPhotoPreview]);
  useEffect(() => {
    if (!open) return;
    setActiveStep(0);
    setErrors({});
    setFormData({
      condominiumUnitId: unitIdPreset || "",
      userId: "",
      fullname: "",
      docType: 1,
      doc: "",
      email: "",
      phone: "",
      unitType: "Owner",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      billingContact: false,
      canVote: false,
      canMakeReservations: false,
      hasGatehouseAccess: false,
    });
    setFirstName("");
    setLastName("");
    setDocumentType(1);
    setDocumentNumber("");
    setEmail("");
    setPhone("");
    setCreatedUserId("");
    setPhotoFile(null);
    setDocumentPhotoFile(null);
    setCoverFile(null);
  }, [open, unitCodePreset, unitIdPreset]);

  useEffect(() => {
    getTypes();
  }, []);

  const dataUser = async (userId: string) => {
    const result = await AccountService.accountMe(userId);
    setDataEdit(result);
  };

  // Dentro do componente, adicionar no useEffect que configura o modo de edição:

  useEffect(() => {
    if (!open || !isEditMode || !editUserId) {
      setDataEdit(undefined);
      return;
    }
    void dataUser(editUserId);

    // Fallback visual enquanto as imagens completas da unidade sao carregadas.
    if (residentImageUrl) {
      setCoverPreview(residentImageUrl);

      const residentImageFile = base64PreviewToFile(
        residentImageUrl,
        "resident-profile.jpg",
      );

      if (residentImageFile) {
        setCoverFile(residentImageFile);
        setPhotoFile(residentImageFile);
      }
    }
  }, [open, isEditMode, editUserId, residentImageUrl]);

  useEffect(() => {
    if (
      !open ||
      !isEditMode ||
      !editUserId ||
      !condominiumIdPreset ||
      !editResident?.condominiumUnitId
    ) {
      return;
    }

    let cancelled = false;

    const toPreviewUrl = (contentType?: string, contentFile?: string) => {
      if (!contentType || !contentFile) return null;
      return `data:${contentType};base64,${contentFile}`;
    };

    const loadExistingResidentImages = async () => {
      try {
        const imageTypes = await condominiumUnitImageService.getUnitImageTypes();

        for (const imageType of imageTypes) {
          const images = await condominiumUnitImageService.getUnitImages(
            condominiumIdPreset,
            editResident.condominiumUnitId,
            imageType.value,
          );

          const residentImage = images.find(
            (image) => image.userId === editUserId,
          );

          if (!residentImage) continue;

          const imageDetail =
            await condominiumUnitImageService.getUnitImageById(
              residentImage.condominiumUnitImageId,
            );

          if (cancelled) return;

          const previewUrl = toPreviewUrl(
            imageDetail.contentType,
            imageDetail.contentFile,
          );

          if (!previewUrl) continue;

          if (imageType.value === "Profile") {
            setCoverPreview(previewUrl);

            const profileFile = base64PreviewToFile(
              previewUrl,
              "resident-profile.jpg",
              imageDetail.contentType,
            );

            if (profileFile) {
              setCoverFile(profileFile);
              setPhotoFile(profileFile);
            }
          }

          if (imageType.value === "Document") {
            setDocumentPhotoPreview(previewUrl);

            const documentFile = base64PreviewToFile(
              previewUrl,
              "resident-document.jpg",
              imageDetail.contentType,
            );

            if (documentFile) {
              setDocumentPhotoFile(documentFile);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar imagens do morador:", error);
      }
    };

    void loadExistingResidentImages();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    isEditMode,
    editUserId,
    condominiumIdPreset,
    editResident?.condominiumUnitId,
  ]);

  const [dataEdit, setDataEdit] = useState<AccountResponse>();
  const selectedUnitOption = unitOptions.find(
    (option) => option.condominiumUnitId === formData.condominiumUnitId,
  );

  const getUnitOptionLabel = (option: CondominiumUnit) =>
    option.unitCode || option.condominiumUnitId;

  const normalizeUnitType = (value: UnitType) => {
    const normalized = String(value || "");
    if (normalized === "1" || normalized.toLowerCase() === "owner") {
      return "Owner";
    }
    if (normalized === "2" || normalized.toLowerCase() === "tenant") {
      return "Tenant";
    }
    return formData.unitType;
  };

  const getSelectedUnitTypeValue = () => {
    const normalizedFormValue = normalizeUnitType(formData.unitType!);
    if (normalizedFormValue === "Owner" || normalizedFormValue === "Tenant") {
      return normalizedFormValue;
    }

    return unit == 1 || unit === "1" ? "Owner" : "Tenant";
  };

  const handleUnitChange = (unitId: string) => {
    const nextUnit = unitOptions.find(
      (option) => option.condominiumUnitId === unitId,
    );
    setFormData((prev) => ({
      ...prev,
      condominiumUnitId: unitId,
      unitType: nextUnit ? normalizeUnitType(nextUnit.unitType!) : prev.unitType,
    }));
    if (errors.condominiumUnitId) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.condominiumUnitId;
        return next;
      });
    }
  };

  useEffect(() => {
    if (!open || !isEditMode || !editUserId) {
      setDataEdit(undefined);
      return;
    }
    console.log("aqui");
    console.log(editResident, {
      open: open,
      isEditMode: isEditMode,
      editUserId: editUserId,
    });
    void dataUser(editUserId);
  }, [open, isEditMode, editUserId]);

  useEffect(() => {
    if (!open) return;
    setActiveStep(0);
    setErrors({});
    if (isEditMode && editResident) {
      setFormData({
        condominiumUnitId:
          editResident.condominiumUnitId || unitCodePreset || "",
        userId: editResident.userId || "",
        fullname: editResident.fullname || "",
        docType: editResident.docType || 1,
        doc: editResident.doc || "",
        email: editResident.email || "",
        phone: editResident.phone || "",
        unitType: editResident.unitType || "Owner",
        startDate: editResident.startDate || "",
        endDate: editResident.endDate || "",
        billingContact: Boolean(editResident.billingContact),
        canVote: Boolean(editResident.canVote),
        canMakeReservations: Boolean(editResident.canMakeReservations),
        hasGatehouseAccess: Boolean(editResident.hasGatehouseAccess),
      });
      setFirstName(dataEdit?.name || "");
      setLastName(dataEdit?.surname || "");
      setDocumentType(dataEdit?.docType || 1);
      setDocumentNumber(
        formatDoc(dataEdit?.doc || "", dataEdit?.docType)
      );
      setEmail(dataEdit?.email || "");
      setPhone(formatPhone(dataEdit?.phone || ""));
      setPhotoFile(null);
      setDocumentPhotoFile(null);
      return;
    }

    setFormData({
      condominiumUnitId: unitIdPreset || "",
      userId: "",
      fullname: "",
      docType: 1,
      doc: "",
      email: "",
      phone: "",
      unitType: "Owner",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      billingContact: false,
      canVote: false,
      canMakeReservations: false,
      hasGatehouseAccess: false,
    });
    setFirstName("");
    setLastName("");
    setDocumentType(1);
    setDocumentNumber("");
    setEmail("");
    setPhone("");
    setPhotoFile(null);
    setDocumentPhotoFile(null);
    setCoverFile(null);
  }, [open, unitCodePreset, unitIdPreset, isEditMode, editResident, dataEdit]);
  const handleChange = (
    field: keyof CondominiumUnitResidentRequest,
    value: string | boolean,
  ) => {
    console.log(field, value);
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };
  if (!open) return null;

  const handleDocumentChange = (value: string) => {
    if (documentType === 1) {
      setDocumentNumber(formatCpf(value));
    } else if (documentType === 2) {
      setDocumentNumber(formatCnpj(value));
    } else {
      setDocumentNumber(value);
    }
  };

  const [typeDoc, setTypeDoc] = useState<TypesDoc[] | null>(null);

  const getTypes = async () => {
    const result = await AccountService.accountTypes();
    setTypeDoc(result);
  };

  const getPeriodErrors = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.condominiumUnitId) {
      nextErrors.condominiumUnitId = t("residenteForm.unitRequired");
    }
    if (!formData.unitType) {
      nextErrors.unitType = t("residenteForm.unitTypeRequired");
    }
    if (!formData.startDate) {
      nextErrors.startDate = t("residenteForm.startDateRequired");
    }
    return nextErrors;
  };

  const getResidentDataErrors = () => {
    const nextErrors: Record<string, string> = {};

    if (!firstName.trim())
      nextErrors.firstName = t("residenteForm.firstNameRequired");
    if (!lastName.trim())
      nextErrors.lastName = t("residenteForm.lastNameRequired");

    const cleanDoc = documentNumber.replace(/\D/g, "");
    if (!cleanDoc) {
      nextErrors.documentNumber = t("residenteForm.documentRequired");
    } else if (documentType === 1) {
      if (cleanDoc.length !== 11) {
        nextErrors.documentNumber = t("residenteForm.cpfInvalid");
      }
    } else if (documentType === 2) {
      if (!validateCnpj(cleanDoc)) {
        nextErrors.documentNumber = t("residenteForm.cnpjInvalid");
      }
    }

    if (!email.trim()) {
      nextErrors.email = t("residenteForm.emailRequired");
    } else if (!/^[^\s@]+@(?:[^\s@.]+\.)+[^\s@.]{2,}$/.test(email.trim())) {
      nextErrors.email = t("residenteForm.emailInvalid");
    }

    if (!phone.trim()) nextErrors.phone = t("residenteForm.phoneRequired");

    return nextErrors;
  };

  const getStepErrors = (step: number) => {
    if (step === 0) return getPeriodErrors();
    if (step === 1) return getResidentDataErrors();
    return {};
  };

  const residentFieldMap: Record<string, keyof CondominiumUnitResidentRequest> =
    {
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

  const residentStepFields: Array<Array<keyof CondominiumUnitResidentRequest>> =
    [
      ["condominiumUnitId", "unitType", "startDate", "endDate"],
      [],
      [
        "billingContact",
        "canVote",
        "canMakeReservations",
        "hasGatehouseAccess",
      ],
    ];

  const token = AuthService.getToken();
  const userId = TokenService.getUserId(token);

  const buildResidentValidationPayload = (): CondominiumUnitResidentRequest => {
    const residentUserId = isEditMode
      ? formData.userId || editResident?.userId || userId || ""
      : createdUserId || userId || "";

    return {
      condominiumUnitId: formData.condominiumUnitId,
      userId: residentUserId,
      fullname: `${firstName.trim()} ${lastName.trim()}`.trim(),
      docType: documentType,
      doc: documentNumber.replace(/\D/g, ""),
      email: email.trim(),
      phone: normalizePhoneToE164(phone),
      unitType: formData.unitType,
      startDate: formData.startDate,
      endDate: formData.endDate || formData.startDate,
      billingContact: formData.billingContact,
      canVote: formData.canVote,
      canMakeReservations: formData.canMakeReservations,
      hasGatehouseAccess: formData.hasGatehouseAccess,
      commit: false,
    };
  };

  const mapBackendValidationErrors = (
    validations: Array<{ field: string; message: string }>,
    onlyStep?: number,
  ) => {
    const nextErrors: Record<string, string> = {};
    let targetStep = 0;

    validations.forEach((validation) => {
      const key = validation.field?.replace(/\s+/g, "").toLowerCase();
      const field = key ? residentFieldMap[key] : undefined;
      if (!field) return;

      const stepIndex = residentStepFields.findIndex((fields) =>
        fields.includes(field),
      );

      if (typeof onlyStep === "number") {
        if (stepIndex !== onlyStep) return;
        nextErrors[field] = validation.message;
        targetStep = onlyStep;
        return;
      }

      nextErrors[field] = validation.message;
      if (stepIndex >= 0) {
        targetStep = Math.max(targetStep, stepIndex);
      }
    });

    return { nextErrors, targetStep };
  };

  const mapAccountValidationErrors = (
    validations: Array<{ field?: string; message: string }>,
  ) => {
    const nextErrors: Record<string, string> = {};
    const accountFieldMap: Record<string, string> = {
      doc: "documentNumber",
      doctype: "documentNumber",
      email: "email",
      phone: "phone",
      name: "firstName",
      surname: "lastName",
    };

    validations.forEach((validation) => {
      const key = validation.field?.replace(/\s+/g, "").toLowerCase();
      const targetField = key ? accountFieldMap[key] : undefined;
      if (targetField) {
        nextErrors[targetField] = validation.message;
      }
    });

    return nextErrors;
  };

  const handleNext = async () => {
    console.log('aa')
    const localErrors = getStepErrors(activeStep);
    if (Object.keys(localErrors).length > 0) {
      console.log('aqui', localErrors)
      setErrors(localErrors);
      return;
    }

    if (activeStep === 0) {
      setActiveStep((prev) => prev + 1);
      return;
    }

    try {
      setLoading(true);
      if (activeStep === 1) {
        const result = await isValidStep();
        if (!result) {
          return;
        }
        setActiveStep((prev) => prev + 1);
        return;
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("residenteForm.validateError");
      showError(message);
      return;
    } finally {
      setLoading(false);
    }

    setActiveStep((prev) => prev + 1);
  };

  const isValidStep = async (): Promise<boolean> => {
    const localErrors = {
      ...getPeriodErrors(),
      ...getResidentDataErrors(),
    };

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      setActiveStep(localErrors.firstName ? 1 : 0);
      return false;
    }

    try {
      setLoading(true);

      if (isEditMode) {
        const targetUserId = formData.userId || editResident?.userId;
        if (!targetUserId) {
          throw new Error("Usuario do morador nao encontrado para edicao.");
        }

        const response = await AccountService.updateAccount(targetUserId, {
          name: firstName.trim(),
          surname: lastName.trim(),
          docType: documentType,
          doc: documentNumber.replace(/\D/g, ""),
          email: email.trim(),
          phone: normalizePhoneToE164(phone),
        });

        setCreatedUserId(response);
      } else {
        const response = await AccountService.createAccount({
          name: firstName.trim(),
          surname: lastName.trim(),
          docType: documentType,
          doc: documentNumber.replace(/\D/g, ""),
          email: email.trim(),
          phone: normalizePhoneToE164(phone),
        });
        setCreatedUserId(response);
      }

      return true;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 422) {
        const responseData = error.response?.data as
          | { validations?: Array<{ field?: string; message: string }> }
          | undefined;
        const mappedErrors = mapAccountValidationErrors(
          responseData?.validations ?? [],
        );

        setErrors(
          Object.keys(mappedErrors).length > 0
            ? mappedErrors
            : {
                documentNumber: t("residenteForm.duplicateDocument"),
                email: t("residenteForm.duplicateDocument"),
              },
        );
        return false;
      } else {
        const message =
          error instanceof Error
            ? error.message
            : t("residenteForm.createError");
        showError(message);
        return false;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    console.log( 'aaa')
    const localErrors = {
      ...getPeriodErrors(),
      ...getResidentDataErrors(),
    };

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      setActiveStep(localErrors.firstName ? 1 : 0);
      return;
    }
    console.log('aqui')
    try {
      setLoading(true);

      const { valid, validations } = await unitResidentService.validateResident(
        buildResidentValidationPayload(),
      );

      if (!valid && validations.length > 0 && firstAccessMode == false) {
        const { nextErrors, targetStep } =
          mapBackendValidationErrors(validations);
        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          setActiveStep(targetStep);
          return;
        }
      }

      const targetUserId = isEditMode
        ? editResident?.userId
        : createdUserId;

      if (!targetUserId) {
        throw new Error(t("residenteForm.accountCreateError"));
      }

      if (!isEditMode) {
        const residentResponse = await unitResidentService.createResident({
          condominiumUnitId: formData.condominiumUnitId,
          userId: targetUserId,
          fullname: `${firstName.trim()} ${lastName.trim()}`.trim(),
          docType: documentType,
          doc: documentNumber.replace(/\D/g, ""),
          email: email.trim(),
          phone: normalizePhoneToE164(phone),
          unitType: formData.unitType,
          startDate: formData.startDate,
          endDate: formData.startDate,
          billingContact: formData.billingContact,
          canVote: formData.canVote,
          canMakeReservations: formData.canMakeReservations,
          hasGatehouseAccess: formData.hasGatehouseAccess,
          commit: true,
        });
        onCreated?.({
          residentId: residentResponse,
          userId: targetUserId,
          label: `${firstName.trim()} ${lastName.trim()}`.trim(),
        });
      }

      if (targetUserId) {
        if (isEditMode) {
          await AccountService.updateAccount(targetUserId, {
            name: firstName.trim(),
            surname: lastName.trim(),
            docType: documentType,
            doc: documentNumber.replace(/\D/g, ""),
            email: email.trim(),
            phone: normalizePhoneToE164(phone),
          });

          if (!editResident?.condominiumUnitResidentId) {
            throw new Error("Morador nao encontrado para edicao.");
          }

                  const residentResponse = await unitResidentService.createResident({
          condominiumUnitId: formData.condominiumUnitId,
          userId: targetUserId,
          fullname: `${firstName.trim()} ${lastName.trim()}`.trim(),
          docType: documentType,
          doc: documentNumber.replace(/\D/g, ""),
          email: email.trim(),
          phone: normalizePhoneToE164(phone),
          unitType: formData.unitType,
          startDate: formData.startDate,
          endDate: formData.startDate,
          billingContact: formData.billingContact,
          canVote: formData.canVote,
          canMakeReservations: formData.canMakeReservations,
          hasGatehouseAccess: formData.hasGatehouseAccess,
          commit: true,
        });
        onCreated?.({
          residentId: residentResponse,
          userId: targetUserId,
          label: `${firstName.trim()} ${lastName.trim()}`.trim(),
        });

          const profileImageFile = coverFile || photoFile;

          // Atualizar a imagem se uma nova foi selecionada
          if (
            profileImageFile &&
            condominiumIdPreset &&
            formData.condominiumUnitId
          ) {
            await condominiumUnitImageService.uploadUnitImage({
              imageType: 1,
              contentFile: profileImageFile,
              condominiumId: condominiumIdPreset,
              condominiumUnitId: formData.condominiumUnitId,
              userId: targetUserId,
            });
          }

          if (
            documentPhotoFile &&
            condominiumIdPreset &&
            formData.condominiumUnitId
          ) {
            await condominiumUnitImageService.uploadUnitImage({
              imageType: 2,
              contentFile: documentPhotoFile,
              condominiumId: condominiumIdPreset,
              condominiumUnitId: formData.condominiumUnitId,
              userId: targetUserId,
            });
          }
        } else {
          // Upload resident photo after creation
          if (photoFile) {
            await condominiumUnitImageService.uploadUnitImage({
              imageType: 1,
              contentFile: photoFile,
              condominiumId:
                condominiumIdPreset ||
                JSON.stringify(localStorage.getItem("condominiumId")),
              condominiumUnitId:
                formData.condominiumUnitId ||
                JSON.stringify(localStorage.getItem("moradoresCondominiumId")),
              userId: targetUserId,
            });
          }

          if (documentPhotoFile) {
            await condominiumUnitImageService.uploadUnitImage({
              imageType: 2,
              contentFile: documentPhotoFile,
              condominiumId:
                condominiumIdPreset ||
                JSON.stringify(localStorage.getItem("condominiumId")),
              condominiumUnitId:
                formData.condominiumUnitId ||
                JSON.stringify(localStorage.getItem("moradoresCondominiumId")),
              userId: targetUserId,
            });
          }
        }
      }

      showSuccess(
        isEditMode
          ? t("residenteForm.updateSuccess")
          : t("residenteForm.createSuccess"),
      );

      setFormData({
        condominiumUnitId: unitIdPreset || "",
        userId: "",
        fullname: "",
        docType: 1,
        doc: "",
        email: "",
        phone: "",
        unitType: "Owner",
        startDate: "",
        endDate: "",
        billingContact: false,
        canVote: false,
        canMakeReservations: false,
        hasGatehouseAccess: false,
      });
      setFirstName("");
      setLastName("");
      setDocumentNumber("");
      setEmail("");
      setPhone("");
      setCreatedUserId("");
      setPhotoFile(null);
      setDocumentPhotoFile(null);
      setCoverFile(null);
      setErrors({});
      setActiveStep(0);
      setCloseAfterModal(true);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 422) {
        const responseData = error.response?.data as
          | { validations?: Array<{ field?: string; message: string }> }
          | undefined;
        const mappedErrors = mapAccountValidationErrors(
          responseData?.validations ?? [],
        );

        setErrors(
          Object.keys(mappedErrors).length > 0
            ? mappedErrors
            : {
                documentNumber: t("residenteForm.duplicateDocument"),
                email: t("residenteForm.duplicateDocument"),
              },
        );
        setActiveStep(1);
      } else {
        const message =
          error instanceof Error
            ? error.message
            : t("residenteForm.createError");
        showError(message);
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

  const permissionItems = [
    {
      key: "billingContact",
      label: t("residenteForm.billingContact"),
      checked: formData.billingContact,
      icon: <AccountBalanceWallet fontSize="small" />,
      color: "#17b26a",
      background: "#dcfae6",
    },
    {
      key: "canVote",
      label: t("residenteForm.canVote"),
      checked: formData.canVote,
      icon: <HowToVote fontSize="small" />,
      color: "#875bf7",
      background: "#f0e8ff",
    },
    {
      key: "canMakeReservations",
      label: t("residenteForm.canMakeReservations"),
      checked: formData.canMakeReservations,
      icon: <EventAvailable fontSize="small" />,
      color: "#f79009",
      background: "#ffead5",
    },
    {
      key: "hasGatehouseAccess",
      label: t("residenteForm.hasGatehouseAccess"),
      checked: formData.hasGatehouseAccess,
      icon: <MeetingRoom fontSize="small" />,
      color: "#06aed4",
      background: "#cff9fe",
    },
  ] as const;

  const renderSectionHeader = (
    icon: React.ReactNode,
    title: string,
    description: string,
  ) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: "8px",
          backgroundColor: "#eff6ff",
          color: "#1976d2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#344054" }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#667085", lineHeight: 1.35 }}>
          {description}
        </Typography>
      </Box>
    </Box>
  );

  const renderPhotoUpload = ({
    id,
    title,
    preview,
    onFileChange,
  }: {
    id: string;
    title: string;
    preview: string | null;
    onFileChange: (file: File | null) => void;
  }) => (
    <ImageUploadField
      label={title}
      previewUrl={preview}
      fileName={
        id === "morador-photo-input"
          ? coverFile?.name || photoFile?.name
          : documentPhotoFile?.name
      }
      height={136}
      emptyLabel="Adicionar foto"
      onChange={onFileChange}
      sx={{ p: 1.5 }}
    />
  );

  const renderStepContent = (step: number) => {
    if (step === 0) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 46,
              },
            }}
            value={condominiumNamePreset || "-"}
            fullWidth
            disabled
            tabIndex={-1}
            InputProps={{ readOnly: true }}
          />
          <TextField
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 46,
              },
            }}
            value={blockNamePreset || "-"}
            fullWidth
            disabled
            tabIndex={-1}
            InputProps={{ readOnly: true }}
          />
          <TextField
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 46,
              },
            }}
            select
            label={formData.condominiumUnitId ? "" : "Unidade"}
            value={formData.condominiumUnitId}
            onChange={(e) => handleUnitChange(e.target.value)}
            error={Boolean(errors.condominiumUnitId)}
            helperText={errors.condominiumUnitId}
            fullWidth
          >
            {unitOptions.length === 0 && formData.condominiumUnitId ? (
              <MenuItem value={formData.condominiumUnitId}>
                {unitCodePreset || "-"}
              </MenuItem>
            ) : null}
            {unitOptions.map((option) => (
              <MenuItem
                key={option.condominiumUnitId}
                value={option.condominiumUnitId}
              >
                {getUnitOptionLabel(option)}
              </MenuItem>
            ))}
            {formData.condominiumUnitId && !selectedUnitOption && unitOptions.length > 0 ? (
              <MenuItem value={formData.condominiumUnitId}>
                {unitCodePreset || formData.condominiumUnitId}
              </MenuItem>
            ) : null}
          </TextField>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: "45px !impotant",
                },
              }}
              select
              label={formData.unitType ? "" : "Tipo de unidade"}
              value={getSelectedUnitTypeValue()}
              onChange={(e) => handleChange("unitType", e.target.value)}
              error={Boolean(errors.unitType)}
              helperText={errors.unitType}
              fullWidth
            >
              <MenuItem value="Owner">{t("common.owner")}</MenuItem>
              <MenuItem value="Tenant">{t("common.tenant")}</MenuItem>
            </TextField>
            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={ptBR}
            >
              <DatePicker
                sx={{
                  height: "46px !impotant",
                  "&.MuiPickersOutlinedInput-root": {
                    height: "46px !important",
                  },
                }}
                label={t("residenteForm.residenceStart")}
                value={parseDatePickerValue(formData.startDate)}
                onChange={(newValue) =>
                  handleChange(
                    "startDate",
                    newValue ? moment(newValue).format("YYYY-MM-DD") : "",
                  )
                }
                slotProps={{
                  textField: {
                    sx: {
                      "& .MuiOutlinedInput-root": {
                        height: 46,
                      },
                    },
                    fullWidth: true,
                    error: Boolean(errors.startDate),
                  },
                }}
              />
            </LocalizationProvider>
          </Box>
        </Box>
      );
    }

    if (step === 1) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, mt: 1 }}>
          <Grid container spacing={1.2}>
            <Grid item xs={12} sm={6}>
              <TextField
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 46,
                  },
                }}
                fullWidth
                placeholder={t("residenteForm.firstName")}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={Boolean(errors.firstName)}
                helperText={errors.firstName}
                inputProps={{ maxLength: 80 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 46,
                  },
                }}
                fullWidth
                placeholder={t("residenteForm.lastName")}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                error={Boolean(errors.lastName)}
                helperText={errors.lastName}
                inputProps={{ maxLength: 120 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 46,
                  },
                }}
                fullWidth
                select
                label={t("residenteForm.documentType")}
                value={documentType}
                onChange={(e) => {
                  setDocumentType(Number(e.target.value) as DocumentType);
                  setDocumentNumber("");
                }}
              >
                {typeDoc !== null &&
                  typeDoc?.map((i) => {
                    return (
                      <MenuItem key={i.id} value={i.id}>
                        {i.description}
                      </MenuItem>
                    );
                  })}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 46,
                  },
                }}
                fullWidth
                placeholder={t("residenteForm.document")}
                value={documentNumber}
                onChange={(e) => handleDocumentChange(e.target.value)}
                error={Boolean(errors.documentNumber)}
                helperText={errors.documentNumber}
                inputProps={{ maxLength: 18 }}
              />
            </Grid>
          </Grid>

          <TextField
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 46,
              },
            }}
            fullWidth
            placeholder={t("residenteForm.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={Boolean(errors.email)}
            helperText={errors.email}
            inputProps={{ maxLength: 254 }}
          />

          <TextField
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 46,
              },
            }}
            fullWidth
            placeholder={t("residenteForm.phone")}
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            error={Boolean(errors.phone)}
            helperText={errors.phone}
            inputProps={{ maxLength: 15 }}
          />
        </Box>
      );
    }

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 0.5 }}>
        <Box
          sx={{
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            p: 1.5,
            backgroundColor: "#fff",
          }}
        >
          {renderSectionHeader(
            <RuleSharp fontSize="small" />,
            t("residenteForm.permissionsTitle"),
            "Defina o que este morador pode fazer no sistema.",
          )}
          <Box
            sx={{
              mt: '6px',
              border: "1px solid #eef2f6",
              borderRadius: "10px",
              overflow: "hidden",
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(220px, 1fr))'
            }}
          >
            {permissionItems.map((item, index) => (
              <Box
                key={item.key}
                sx={{
                  minHeight: 30,
                  px: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom:
                    index === permissionItems.length - 1
                      ? "none"
                      : "1px solid #eef2f6",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "7px",
                      backgroundColor: item.background,
                      color: item.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography
                    sx={{ fontSize: 13, fontWeight: 500, color: "#344054" }}
                  >
                    {item.label}
                  </Typography>
                </Box>
                <Checkbox
                  checked={Boolean(item.checked)}
                  onChange={(e) => handleChange(item.key, e.target.checked)}
                  sx={{ p: 0.5 }}
                />
              </Box>
            ))}
          </Box>
        </Box>
        <Box
          sx={{
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            p: 1.5,
            backgroundColor: "#fff",
          }}
        >
          {renderSectionHeader(
            <CameraAlt fontSize="small" />,
            t("residenteForm.photoTitle"),
            "Adicione as fotos para identificação no sistema.",
          )}

          <Box
            sx={{
              mt: 1,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.5,
              "& > :nth-of-type(n+3)": {
                display: "none",
              },
            }}
          >
            {renderPhotoUpload({
              id: "morador-photo-input",
              title: "👤 Foto do morador",
              preview: coverPreview,
              onFileChange: (file) => {
                setCoverFile(file);
                setPhotoFile(file);
              },
            })}
            {renderPhotoUpload({
              id: "morador-document-photo-input",
              title: "🪪 Documento com foto",
              preview: documentPhotoPreview,
              onFileChange: setDocumentPhotoFile,
            })}

          </Box>
        </Box>
      </Box>
    );
  };

  const renderActions = () => {
    if (activeStep === STEPS.length - 1) {
      return (
        <Button
          sx={{ marginTop: "16px !important" }}
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : t("common.finish")}
        </Button>
      );
    }

    return (
      <Button
        variant="contained"
        sx={{ marginTop: "16px !important" }}
        onClick={handleNext}
        disabled={loading}
      >
        {t("common.next")}
      </Button>
    );
  };

  const cardClassName =
    activeStep === STEPS.length - 1
      ? "resident-final-step"
      : "resident-form-step";

  useEffect(() => {
  const aplicarEstilo = () => {
    const elementos = document.querySelectorAll(
      '.step-wizard-card > div:last-child, .step-wizard-card .step-wizard-actions'
    );

    elementos.forEach((elemento) => {
      (elemento as HTMLElement).style.marginTop = '0px';
    });
  };

  aplicarEstilo();

  return () => {
    const elementos = document.querySelectorAll(
      '.step-wizard-card > div:last-child, .step-wizard-card .step-wizard-actions'
    );

    elementos.forEach((elemento) => {
      (elemento as HTMLElement).style.removeProperty('margin-top');
    });
  };
}, []);

  return (
    <>
      {isEditMode ? (
        <>
          {dataEdit ? (
            <>
              <StepWizardCard
                title={t("residenteForm.title")}
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
                width={activeStep === STEPS.length - 1 ? "820px" : "760px"}
                className={cardClassName}
                onClose={onClose}
                disableContent={loading}
                actions={renderActions()}
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
          ) : (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
              }}
            >
              <CircularProgress size={50} />
            </Box>
          )}
        </>
      ) : (
        <>
          <>
            <StepWizardCard
              title={t("residenteForm.title")}
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
              width={activeStep === STEPS.length - 1 ? "820px" : "760px"}
              className={cardClassName}
              onClose={onClose}
              disableContent={loading}
              actions={renderActions()}
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
        </>
      )}
    </>
  );
};

export default ResidenteForm;
