import { AxiosError } from "axios";
import React, { Suspense, useEffect, useState } from "react";
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
} from "@mui/material";
import { FileUploadOutlined, RuleSharp } from "@mui/icons-material";
import {
  unitResidentService,
  type CondominiumUnitResident,
  type CondominiumUnitResidentRequest,
} from "../../services/unitResidentService";
import { AppStateModal } from "../../shared/components/AppStateModal";
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
  editResident?: CondominiumUnitResident | null;
  editAccount?: AccountResponse | null;
  residentImageUrl?: string; // NOVA PROP
}

type DocumentType = 1 | 2 | 3 | 4;

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

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Erro ao ler foto."));
    reader.readAsDataURL(file);
  });

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
  editResident,
  editAccount,
  residentImageUrl,
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
    unitType: "Owner",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    billingContact: false,
    canVote: false,
    canMakeReservations: false,
    hasGatehouseAccess: false,
  });

  const [account, setAccount] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeStep, setActiveStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>(1);
  const [documentNumber, setDocumentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
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
    if (!open) return;
    setActiveStep(0);
    setErrors({});
    setFormData({
      condominiumUnitId: unitIdPreset || "",
      userId: "",
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
    if (!open || !isEditMode || !editAccount?.userId) {
      setDataEdit(undefined);
      return;
    }
    void dataUser(editAccount.userId);

    // Se tiver uma imagem, carregar a prévia
    if (residentImageUrl) {
      // Converter a URL base64 para um objeto File (opcional, mas útil para consistência)
      fetch(residentImageUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "resident-photo.jpg", {
            type: blob.type,
          });
          setPhotoFile(file);
          setCoverPreview(residentImageUrl);
        })
        .catch((error) => {
          console.error("Erro ao carregar imagem do morador:", error);
        });
    }
  }, [open, isEditMode, editAccount?.userId, residentImageUrl]);

  const [dataEdit, setDataEdit] = useState<AccountResponse>();

  useEffect(() => {
    if (!open || !isEditMode || !editAccount?.userId) {
      setDataEdit(undefined);
      return;
    }
    void dataUser(editAccount.userId);
  }, [open, isEditMode, editAccount?.userId]);

  useEffect(() => {
    if (!open) return;
    setActiveStep(isEditMode ? 1 : 0);
    setErrors({});
    if (isEditMode && editResident) {
      setFormData({
        condominiumUnitId:
          editResident.condominiumUnitId || unitCodePreset || "",
        userId: editResident.userId || "",
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
        dataEdit?.docType === 1
          ? formatCpf(dataEdit.doc || "")
          : dataEdit?.docType === 2
            ? formatCnpj(dataEdit?.doc || "")
            : dataEdit?.doc || "",
      );
      setEmail(dataEdit?.email || "");
      setPhone(formatPhone(dataEdit?.phone || ""));
      setPhotoFile(null);
      return;
    }

    setFormData({
      condominiumUnitId: unitIdPreset || "",
      userId: "",
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
    setCoverFile(null);
  }, [
    open,
    unitCodePreset,
    unitIdPreset,
    isEditMode,
    editResident,
    editAccount,
    dataEdit,
  ]);

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

  const handleChange = (
    field: keyof CondominiumUnitResidentRequest,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
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
    } else if (!/\S+@\S+\.\S+/.test(email)) {
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

  const buildResidentValidationPayload =
    (): CondominiumUnitResidentRequest => ({
      condominiumUnitId: formData.condominiumUnitId,
      userId: userId!,
      unitType: formData.unitType,
      startDate: formData.startDate,
      endDate: formData.endDate || formData.startDate,
      billingContact: formData.billingContact,
      canVote: formData.canVote,
      canMakeReservations: formData.canMakeReservations,
      hasGatehouseAccess: formData.hasGatehouseAccess,
      commit: false,
    });

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
    const localErrors = getStepErrors(activeStep);
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
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

      const { valid, validations } = await unitResidentService.validateResident(
        buildResidentValidationPayload(),
      );

      if (!valid && validations.length > 0) {
        const { nextErrors } = mapBackendValidationErrors(
          validations,
          activeStep,
        );
        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          return;
        }
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

        setAccount(response);
      } else {
        const response = await AccountService.createAccount({
          name: firstName.trim(),
          surname: lastName.trim(),
          docType: documentType,
          doc: documentNumber.replace(/\D/g, ""),
          email: email.trim(),
          phone: normalizePhoneToE164(phone),
        });
        setAccount(response);
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
    const localErrors = {
      ...getPeriodErrors(),
      ...getResidentDataErrors(),
    };

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      setActiveStep(localErrors.firstName ? 1 : 0);
      return;
    }

    try {
      setLoading(true);

      const { valid, validations } = await unitResidentService.validateResident(
        buildResidentValidationPayload(),
      );

      if (!valid && validations.length > 0) {
        const { nextErrors, targetStep } =
          mapBackendValidationErrors(validations);
        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          setActiveStep(targetStep);
          return;
        }
      }

      if (!account) {
        throw new Error(t("residenteForm.accountCreateError"));
      }

      if(!isEditMode) {
        await unitResidentService.createResident({
          condominiumUnitId: formData.condominiumUnitId,
        userId: account,
        unitType: formData.unitType,
        startDate: formData.startDate,
        endDate: formData.startDate,
        billingContact: formData.billingContact,
        canVote: formData.canVote,
        canMakeReservations: formData.canMakeReservations,
        hasGatehouseAccess: formData.hasGatehouseAccess,
        commit: true,
      });
    }
      
      if (isEditMode && editAccount?.userId) {
        await AccountService.updateAccount(editAccount.userId, {
          name: firstName.trim(),
          surname: lastName.trim(),
          docType: documentType,
          doc: documentNumber.replace(/\D/g, ""),
          email: email.trim(),
          phone: normalizePhoneToE164(phone),
        });

        // Atualizar a imagem se uma nova foi selecionada
        if (photoFile && condominiumIdPreset && formData.condominiumUnitId) {
          await condominiumUnitImageService.uploadUnitImage({
            imageType: 1,
            contentFile: photoFile,
            condominiumId: condominiumIdPreset,
            condominiumUnitId: formData.condominiumUnitId,
            userId: editAccount.userId,
          });
        }

        // Upload resident photo after creation
        if (photoFile) {
          await condominiumUnitImageService.uploadUnitImage({
            imageType: 1,
            contentFile: photoFile,
            condominiumId: condominiumIdPreset || "",
            condominiumUnitId: formData.condominiumUnitId,
            userId: account,
          });
        }
      }

      await onSaved();
      showSuccess(t("residenteForm.createSuccess"));

      setFormData({
        condominiumUnitId: unitIdPreset || "",
        userId: "",
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
      setPhotoFile(null);
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

  const handleModalClose = () => {
    handleClose();
    if (closeAfterModal) {
      setCloseAfterModal(false);
      onClose();
    }
  };

  const renderStepContent = (step: number) => {
    if (step === 0) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
            value={unitCodePreset || "-"}
            fullWidth
            disabled
            tabIndex={-1}
            InputProps={{ readOnly: true }}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: "45px !impotant",
                },
              }}
              select
              value={formData.unitType || ""}
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
                value={
                  formData.startDate
                    ? new Date(`${formData.startDate}T00:00:00`)
                    : null
                }
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
          <Grid container spacing={1.2}>
            <Grid item xs={12} sm={6}>
              <TextField
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 46,
                  },
                }}
                fullWidth
                label={firstName ? "" : t("residenteForm.firstName")}
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
                label={lastName ? "" : t("residenteForm.lastName")}
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
                label={documentNumber ? "" : t("residenteForm.document")}
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
            label={email ? "" : t("residenteForm.email")}
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
            label={phone ? "" : t("residenteForm.phone")}
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
      /*   <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        

        
      </Box> */
      <Grid item xs={12} md={6}>
        <Box
          sx={{
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            p: 2,
            height: "100%",
            backgroundColor: "#fff",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 0.5,
            }}
          >
            <Box sx={{ color: "primary.main" }}>
              <RuleSharp />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1 }}>
              {t("residenteForm.permissionsTitle")}
            </Typography>
          </Box>
          <Box sx={{ borderBottom: "1px solid #e2e8f0", mb: 1.25 }} />
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <FormControlLabel
              sx={{ height: "25px" }}
              control={
                <Checkbox
                  checked={Boolean(formData.billingContact)}
                  onChange={(e) =>
                    handleChange("billingContact", e.target.checked)
                  }
                />
              }
              label={t("residenteForm.billingContact")}
            />
            <FormControlLabel
              sx={{ height: "25px" }}
              control={
                <Checkbox
                  checked={Boolean(formData.canVote)}
                  onChange={(e) => handleChange("canVote", e.target.checked)}
                />
              }
              label={t("residenteForm.canVote")}
            />
            <FormControlLabel
              sx={{ height: "25px" }}
              control={
                <Checkbox
                  checked={Boolean(formData.canMakeReservations)}
                  onChange={(e) =>
                    handleChange("canMakeReservations", e.target.checked)
                  }
                />
              }
              label={t("residenteForm.canMakeReservations")}
            />
            <FormControlLabel
              sx={{ height: "25px" }}
              control={
                <Checkbox
                  checked={Boolean(formData.hasGatehouseAccess)}
                  onChange={(e) =>
                    handleChange("hasGatehouseAccess", e.target.checked)
                  }
                />
              }
              label={t("residenteForm.hasGatehouseAccess")}
            />
          </Box>
        </Box>
        <Typography variant="subtitle2" sx={{ mt: 2 }}>
          {t("residenteForm.photoTitle")}
        </Typography>
        <Box
          component="label"
          sx={{
            border: "1px dashed #c8cfdb",
            borderRadius: "10px",
            minHeight: "120px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 1,
            cursor: "pointer",
          }}
          htmlFor="morador-photo-input"
        >
          <input
            id="morador-photo-input"
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setCoverFile(file);
              setPhotoFile(file);
            }}
          />
          {!coverPreview && (
            <FileUploadOutlined sx={{ fontSize: 40, color: "#7ba0d1" }} />
          )}
          {coverPreview ? (
            <Box
              component="img"
              src={coverPreview}
              alt="Prévia da imagem do condomínio"
              sx={{ width: "60%", maxHeight: "40%", objectFit: "cover" }}
            />
          ) : (
            <Typography
              sx={{
                color: "#94a3b8",
                fontSize: 12,
                px: 1,
                textAlign: "center",
              }}
            >
              Nenhuma imagem selecionada
            </Typography>
          )}
        </Box>
      </Grid>
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

  return (
    <>
      {isEditMode ? (
        <>
          {dataEdit ? (
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
                width="500px"
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
              width="500px"
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
