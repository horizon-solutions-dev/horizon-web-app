import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  MenuItem,
  TextField,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type {
  AccountDocumentType,
  CreateAccountRequest,
  TypesDoc,
} from "../../models/api.model";
import { AccountService } from "../../services/accountService";
import StepWizardCard from "../../shared/components/StepWizardCard";
import { AppStateModal } from "../../shared/components/AppStateModal";
import { useAppStateModal } from "../../shared/utils/useAppStateModal";

interface SignUpProps {
  onBack: () => void;
  onSuccess: (payload: { email: string; userId: string }) => void;
}

type SignUpFormData = {
  name: string;
  surname: string;
  docType: string;
  doc: string;
  email: string;
  phone: string;
};

const steps = ["Informações iniciais", "Contato"];

const initialFormData: SignUpFormData = {
  name: "",
  surname: "",
  docType: "CompanyTaxDoc",
  doc: "",
  email: "",
  phone: "",
};

const fallbackDocTypes: TypesDoc[] = [
  { id: 1, value: "TaxDoc", description: "CPF" },
  { id: 2, value: "CompanyTaxDoc", description: "CNPJ" },
  { id: 3, value: "Passport", description: "Passaporte" },
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9()\s-]{8,32}$/;

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
  if (digits.length <= 8) {
    return digits.replace(/(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
  }
  if (digits.length <= 12) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, "$1.$2.$3/$4");
  }
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, "$1.$2.$3/$4-$5");
};

const validateCpf = (value: string) => {
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += parseInt(cpf.charAt(i), 10) * (10 - i);
  }
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += parseInt(cpf.charAt(i), 10) * (11 - i);
  }
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  return digit === parseInt(cpf.charAt(10), 10);
};

const validateCnpj = (value: string) => {
  const cnpj = value.replace(/\D/g, "");
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i -= 1) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0), 10)) return false;

  size += 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i -= 1) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1), 10);
};

const getDocumentCategory = (docType: string) => {
  const normalized = docType.trim().toLowerCase();

  if (
    normalized.includes("company") ||
    normalized.includes("cnpj") ||
    normalized.includes("corporate")
  ) {
    return "cnpj";
  }

  if (
    normalized.includes("taxdoc") ||
    normalized.includes("cpf") ||
    normalized === "taxdoc"
  ) {
    return "cpf";
  }

  if (
    normalized.includes("passport") ||
    normalized.includes("passaporte") ||
    normalized.includes("pass")
  ) {
    return "passport";
  }

  if (
    normalized.includes("driver") ||
    normalized.includes("license") ||
    normalized.includes("cnh")
  ) {
    return "driver";
  }

  return "generic";
};

const formatDocument = (value: string, docType: string) => {
  const category = getDocumentCategory(docType);

  if (category === "cpf") return formatCpf(value);
  if (category === "cnpj") return formatCnpj(value);
  if (category === "passport" || category === "driver") {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
  }

  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
};

const getDocumentPlaceholder = (docType: string) => {
  const category = getDocumentCategory(docType);
  if (category === "cpf") return "000.000.000-00";
  if (category === "cnpj") return "00.000.000/0000-00";
  if (category === "passport") return "Passaporte";
  if (category === "driver") return "CNH";
  return "Documento";
};

const isValidDocument = (value: string, docType: string) => {
  const category = getDocumentCategory(docType);
  const cleanValue = value.replace(/\D/g, "");
  const normalizedValue = value.replace(/[^A-Z0-9]/gi, "");

  if (category === "cpf") return validateCpf(value);
  if (category === "cnpj") return validateCnpj(value);
  if (category === "passport" || category === "driver") {
    return normalizedValue.length >= 5 && normalizedValue.length <= 20;
  }

  return cleanValue.length >= 5 || normalizedValue.length >= 5;
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  if (!digits) return "";

  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  const limited = withCountry.slice(0, 13);
  const ddi = limited.slice(0, 2);
  const ddd = limited.slice(2, 4);
  const number = limited.slice(4);

  if (limited.length <= 2) return `+${ddi}`;
  if (limited.length <= 4) return `+${ddi} ${ddd}`;
  if (number.length <= 4) return `+${ddi} (${ddd}) ${number}`;
  if (number.length <= 8) {
    return `+${ddi} (${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
  }
  return `+${ddi} (${ddd}) ${number.slice(0, 5)}-${number.slice(5, 9)}`;
};

const normalizePhoneToE164 = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
};

export default function SignUp({ onBack, onSuccess }: SignUpProps) {
  const { t } = useTranslation();
  const { appStateModal, handleClose, showError } = useAppStateModal();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<SignUpFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [docTypes, setDocTypes] = useState<TypesDoc[]>(fallbackDocTypes);
  const [typesLoading, setTypesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const notTrue = false
  useEffect(() => {
    const loadTypes = async () => {
      setTypesLoading(true);
      try {
        const response = await AccountService.accountTypes();
        if (response?.length) {
          setDocTypes(response);
          return;
        }
        setDocTypes(fallbackDocTypes);
      } catch {
        setDocTypes(fallbackDocTypes);
      } finally {
        setTypesLoading(false);
      }
    };
    if(notTrue) {
      loadTypes();
    }
  }, []);

  const handleChange = (field: keyof SignUpFormData, value: string) => {
    let nextValue = value;

    if (field === "doc") {
      nextValue = formatDocument(value, formData.docType);
    }

    if (field === "phone") {
      nextValue = formatPhone(value);
    }

    if (field === "docType") {
      nextValue = value;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: nextValue,
      ...(field === "docType" ? { doc: "" } : {}),
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[field];
        return nextErrors;
      });
    }

    if (field === "docType" && errors.doc) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors.doc;
        return nextErrors;
      });
    }
  };

  const validateInitialStep = () => {
    const nextErrors: Record<string, string> = {};
    const trimmedName = formData.name.trim();
    const trimmedSurname = formData.surname.trim();

    if (!trimmedName) {
      nextErrors.name = t("validation.nameRequired") || "Nome é obrigatório.";
    } else if (trimmedName.length < 2) {
      nextErrors.name = t("validation.nameTooShort") || "Mínimo 3 caracteres";
    } else if (trimmedName.length > 64) {
      nextErrors.name = "Nome deve ter no máximo 64 caracteres.";
    }

    if (!trimmedSurname) {
      nextErrors.surname =
        t("validation.surnameRequired") || "Sobrenome é obrigatório.";
    } else if (trimmedSurname.length < 2) {
      nextErrors.surname =
        t("validation.surnameTooShort") || "Mínimo 3 caracteres";
    } else if (trimmedSurname.length > 128) {
      nextErrors.surname = "Sobrenome deve ter no máximo 128 caracteres.";
    }

    if (!formData.docType) {
      nextErrors.docType =
        t("validation.docTypeRequired") || "Tipo de documento é obrigatório.";
    }

    if (!formData.doc.trim()) {
      nextErrors.doc =
        t("validation.docRequired") || "Documento é obrigatório.";
    } else if (!isValidDocument(formData.doc, formData.docType)) {
      nextErrors.doc =
        t("validation.invalidDoc") || "Documento informado é inválido.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateContactStep = () => {
    const nextErrors: Record<string, string> = {};
    const trimmedEmail = formData.email.trim();
    const normalizedPhone = normalizePhoneToE164(formData.phone);

    if (!trimmedEmail) {
      nextErrors.email =
        t("validation.emailRequired") || "Email é obrigatório.";
    } else if (trimmedEmail.length > 256 || !emailRegex.test(trimmedEmail)) {
      nextErrors.email = t("validation.emailInvalid") || "Email inválido.";
    }

    if (!formData.phone.trim()) {
      nextErrors.phone =
        t("validation.phoneRequired") || "Telefone é obrigatório.";
    } else if (
      !phoneRegex.test(formData.phone) ||
      normalizedPhone.replace(/\D/g, "").length < 12
    ) {
      nextErrors.phone =
        t("validation.invalidPhone") ||
        "Telefone inválido (ex.: +55 11 99999-9999).";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateInitialStep()) return;
    setActiveStep(1);
  };

  const handleBack = () => {
    if (activeStep === 0) {
      onBack();
      return;
    }

    setActiveStep((prev) => Math.max(0, prev - 1));
  };

  const mapApiValidationErrors = (
    validations: Array<{ field?: string; message?: string }>,
  ) => {
    const fieldMap: Record<string, keyof SignUpFormData> = {
      name: "name",
      surname: "surname",
      lastname: "surname",
      doc: "doc",
      doctype: "docType",
      email: "email",
      phone: "phone",
    };

    const nextErrors: Record<string, string> = {};
    let targetStep = 0;

    validations.forEach((validation) => {
      const key = validation.field?.replace(/\s+/g, "").toLowerCase() || "";
      const field = fieldMap[key];
      if (!field || !validation.message) return;
      nextErrors[field] = validation.message;
      if (field === "email" || field === "phone") {
        targetStep = 1;
      }
    });

    return { nextErrors, targetStep };
  };

  const handleSubmit = async () => {
    if (!validateContactStep()) return;

    const payload: CreateAccountRequest = {
      name: formData.name.trim(),
      surname: formData.surname.trim(),
      docType: formData.docType as AccountDocumentType,
      doc:
        getDocumentCategory(formData.docType) === "passport" ||
        getDocumentCategory(formData.docType) === "driver"
          ? formData.doc.replace(/[^A-Z0-9]/gi, "").toUpperCase()
          : formData.doc.replace(/\D/g, ""),
      email: formData.email.trim(),
      phone: normalizePhoneToE164(formData.phone),
    };

    setIsSubmitting(true);
    try {
      const createdUserId = await AccountService.createAccount(payload);
      onSuccess({
        email: formData.email.trim(),
        userId: createdUserId,
      });
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 422) {
        const responseData = error.response.data as
          | { validations?: Array<{ field?: string; message?: string }> }
          | undefined;

        const { nextErrors, targetStep } = mapApiValidationErrors(
          responseData?.validations ?? [],
        );

        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          setActiveStep(targetStep);
          return;
        }
      }

      const message =
        error instanceof Error
          ? error.message
          : t("signup.createError") || "Erro ao criar conta.";
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box className="page-container" sx={{
          height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
    }}>
      <Container maxWidth="xl">
      <StepWizardCard
      
        title={t("signup.title") || "Criar Conta"}
        steps={steps}
        activeStep={activeStep}
        showBack={true}
        onBack={handleBack}
        backLabel={t("login.back") || "Voltar"}
        onClose={onBack}
        disableContent={isSubmitting}
        width="720px"
        actions={
          <Box sx={{ display: "flex", justifyContent: "center", width: "100%", mt:2 }}>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isSubmitting}
                sx={{ textTransform: "none", minWidth: 156 }}
              >
                {isSubmitting ? (
                  <>
                    <CircularProgress size={18} sx={{ mr: 1, color: "inherit" }} />
                    {t("signup.creating") || "Criando conta..."}
                  </>
                ) : (
                  t("common.finish") || "Concluir"
                )}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={isSubmitting}
                sx={{ textTransform: "none", minWidth: 156 }}
              >
                {t("common.next") || "Avançar"}
              </Button>
            )}
          </Box>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {activeStep === 0 ? (
            <>
              <TextField
                fullWidth
                placeholder={t("signup.name") || "Nome"}
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                inputProps={{ maxLength: 64 }}
                sx={{ "& .MuiOutlinedInput-root": { height: 46 } }}
              />

              <TextField
                fullWidth
                placeholder={t("signup.surname") || "Sobrenome"}
                value={formData.surname}
                onChange={(e) => handleChange("surname", e.target.value)}
                error={!!errors.surname}
                helperText={errors.surname}
                inputProps={{ maxLength: 128 }}
                sx={{ "& .MuiOutlinedInput-root": { height: 46 } }}
              />

              <TextField
                fullWidth
                select
                label={formData.docType ? "" : t("signup.docType") || "Tipo de Documento"}
                value={formData.docType}
                onChange={(e) => handleChange("docType", e.target.value)}
                error={!!errors.docType}
                helperText={errors.docType}
                sx={{ "& .MuiOutlinedInput-root": { height: 46 } }}
              >
                {typesLoading ? (
                  <MenuItem value="" disabled>
                    {t("common.loading") || "Carregando..."}
                  </MenuItem>
                ) : (
                  docTypes.map((type) => (
                    <MenuItem key={`${type.id}-${type.value}`} value={type.value}>
                      {type.description || type.value}
                    </MenuItem>
                  ))
                )}
              </TextField>

              <TextField
                fullWidth
                placeholder={getDocumentPlaceholder(formData.docType)}
                value={formData.doc}
                onChange={(e) => handleChange("doc", e.target.value)}
                error={!!errors.doc}
                helperText={errors.doc}
                inputProps={{
                  maxLength:
                    getDocumentCategory(formData.docType) === "cpf"
                      ? 14
                      : getDocumentCategory(formData.docType) === "cnpj"
                        ? 18
                        : 20,
                }}
                sx={{ "& .MuiOutlinedInput-root": { height: 46 } }}
              />
            </>
          ) : (
            <>

              <TextField
                fullWidth
                placeholder={t("signup.email") || "E-mail"}
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                inputProps={{ maxLength: 256 }}
                sx={{ "& .MuiOutlinedInput-root": { height: 46 } }}
              />

              <TextField
                fullWidth
                placeholder={t("signup.phone") || "Telefone"}
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                error={!!errors.phone}
                helperText={errors.phone || "+55 (11) 99999-9999"}
                sx={{ "& .MuiOutlinedInput-root": { height: 46 } }}
              />
            </>
          )}
        </Box>
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
        showCancel={false}
      />
    </Container>
    </Box>
  );
}
