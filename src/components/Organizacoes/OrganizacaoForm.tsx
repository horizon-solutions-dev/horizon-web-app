import { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  TextField,
} from "@mui/material";
import { AppStateModal } from "../../shared/components/AppStateModal";
import StepWizardCard from "../../shared/components/StepWizardCard";
import { useAppStateModal } from "../../shared/utils/useAppStateModal";
import {
  organizationService,
  type Organization,
  type OrganizationRequest,
  type OrganizationTypeEnum,
} from "../../services/organizationService";
import { AuthService } from "../../services/authService";
import { TokenService } from "../../services/tokenService";
import "./Organizacoes.scss";

interface OrganizacaoFormProps {
  open: boolean;
  editingOrganization: Organization | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  organizationTypes: OrganizationTypeEnum[];
  typesLoading: boolean;
  typesError: string | null;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const initialForm: OrganizationRequest = {
  name: "",
  legalName: "",
  doc: "",
  orgType: "",
  email: "",
  phone: "",
  city: "",
  state: "",
};

const formatCNPJ = (value: string) => {
  const numbers = value.replace(/\D/g, "").slice(0, 14);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return numbers.replace(/(\d{2})(\d+)/, "$1.$2");
  if (numbers.length <= 8) {
    return numbers.replace(/(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
  }
  if (numbers.length <= 12) {
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, "$1.$2.$3/$4");
  }
  return numbers.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
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
  const numbers = value.replace(/\D/g, "").slice(0, 8);
  if (numbers.length <= 5) return numbers;
  return numbers.replace(/(\d{5})(\d+)/, "$1-$2");
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^(\+55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}[- ]?\d{4}$/;
const stateRegex = /^[A-Z]{2}$/;

const OrganizacaoForm: React.FC<OrganizacaoFormProps> = ({
  open,
  editingOrganization,
  onClose,
  onSaved,
  organizationTypes,
  typesLoading,
  loading,
  setLoading,
}) => {
  const { appStateModal, handleClose, showSuccess, showError } =
    useAppStateModal();
  const [closeAfterModal, setCloseAfterModal] = useState(false);
  const steps = ["Informações iniciais", "Contato e Endereço"];
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<OrganizationRequest>(initialForm);
  const [cep, setCep] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [locationFieldsDisabled, setLocationFieldsDisabled] = useState({
    city: true,
    state: true,
  });
  const [states, setStates] = useState<Array<{ sigla: string; nome: string }>>(
    [],
  );
  const [statesLoading, setStatesLoading] = useState(false);
  const [statesError, setStatesError] = useState<string | null>(null);

  useEffect(() => {
    const loadStates = async () => {
      setStatesLoading(true);
      setStatesError(null);
      try {
        const response = await fetch(
          "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome",
        );
        const data = (await response.json()) as Array<{
          sigla: string;
          nome: string;
        }>;
        setStates(data ?? []);
      } catch {
        setStatesError("Erro ao carregar estados.");
      } finally {
        setStatesLoading(false);
      }
    };

    loadStates();
  }, []);

  useEffect(() => {
    if (!open) return;
    setActiveStep(0);
    setCep("");
    setErrors({});
    setCepError(null);
    setLocationFieldsDisabled({ city: true, state: true });

    if (editingOrganization) {
      const existingZip =
        editingOrganization.zipCode || editingOrganization.cep || "";
      setCep(formatCEP(existingZip));
      setFormData({
        name: editingOrganization.name || "",
        legalName: editingOrganization.legalName || "",
        doc: formatCNPJ(editingOrganization.doc || ""),
        orgType: editingOrganization.orgType ?? "",
        email: editingOrganization.email || "",
        phone: formatPhone(editingOrganization.phone || ""),
        city: editingOrganization.city || "",
        state: (editingOrganization.state || "").toUpperCase(),
        zipCode: existingZip,
      });
      return;
    }

    setFormData(initialForm);
  }, [open, editingOrganization]);

  if (!open) return null;

  const handleChange = (field: keyof OrganizationRequest, value: string) => {
    let nextValue = value;
    if (field === "doc") nextValue = formatCNPJ(value);
    if (field === "phone") nextValue = formatPhone(value);
    if (field === "state") nextValue = value.toUpperCase().slice(0, 2);

    setFormData((prev) => ({ ...prev, [field]: nextValue }));
    if (errors[field]) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[field];
        return nextErrors;
      });
    }
  };

  const validateInitialStep = () => {
    const nextErrors: Record<string, string> = {};
    const trimmedName = formData.name.trim();
    const trimmedLegalName = formData.legalName.trim();

    if (!trimmedName) {
      nextErrors.name = "Nome fantasia obrigatorio.";
    } else if (trimmedName.length < 2 || trimmedName.length > 150) {
      nextErrors.name = "Nome fantasia deve ter entre 2 e 150 caracteres.";
    }

    if (!trimmedLegalName) {
      nextErrors.legalName = "Razao social obrigatoria.";
    } else if (trimmedLegalName.length < 2 || trimmedLegalName.length > 200) {
      nextErrors.legalName = "Razao social deve ter entre 2 e 200 caracteres.";
    }

    if (formData.doc.replace(/\D/g, "").length !== 14) {
      nextErrors.doc = "CNPJ invalido.";
    }
    if (!formData.orgType) nextErrors.orgType = "Selecione o tipo.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateContactStep = () => {
    const nextErrors: Record<string, string> = {};
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedCity = formData.city.trim();
    const trimmedState = formData.state.trim();

    if (!trimmedEmail) {
      nextErrors.email = "Email obrigatorio.";
    } else if (trimmedEmail.length > 254 || !emailRegex.test(trimmedEmail)) {
      nextErrors.email = "Email invalido.";
    }

    if (!trimmedPhone) {
      nextErrors.phone = "Telefone obrigatorio.";
    } else if (!phoneRegex.test(trimmedPhone)) {
      nextErrors.phone = "Telefone invalido.";
    }

    if (!trimmedCity) {
      nextErrors.city = "Cidade obrigatoria.";
    } else if (trimmedCity.length < 2 || trimmedCity.length > 100) {
      nextErrors.city = "Cidade deve ter entre 2 e 100 caracteres.";
    }

    if (!trimmedState) {
      nextErrors.state = "UF obrigatoria.";
    } else if (!stateRegex.test(trimmedState)) {
      nextErrors.state = "UF invalida. Use 2 letras maiusculas.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCepLookup = async (rawCep: string) => {
    const cep = rawCep.replace(/\D/g, "");
    if (cep.length !== 8) {
      setLocationFieldsDisabled({ city: true, state: true });
      return;
    }

    setCepLoading(true);
    setCepError(null);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (data?.erro) {
        setCepError("CEP nao encontrado.");
        setFormData((prev) => ({ ...prev, city: "", state: "" }));
        setLocationFieldsDisabled({ city: false, state: false });
        return;
      }

      const newAddressData = {
        city: data.localidade || "",
        state: data.uf || "",
      };

      setFormData((prev) => ({
        ...prev,
        ...newAddressData,
      }));

      // Clear errors for fields that just got populated
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        if (newAddressData.city) delete newErrors.city;
        if (newAddressData.state) delete newErrors.state;
        return newErrors;
      });

      setLocationFieldsDisabled({
        city: !!data.localidade,
        state: !!data.uf,
      });
    } catch {
      setCepError("Erro ao consultar CEP.");
      setFormData((prev) => ({ ...prev, city: "", state: "" }));
      setLocationFieldsDisabled({ city: false, state: false });
    } finally {
      setCepLoading(false);
    }
  };

  const handleNext = () => {
    if (!validateInitialStep()) return;
    setActiveStep(1);
  };

  const handleBack = () => {
    if (activeStep === 0) {
      onClose();
      return;
    }
    setActiveStep((prev) => Math.max(0, prev - 1));
  };

  const handleSubmit = async () => {
    if (!validateContactStep()) return;

    const payload: OrganizationRequest = {
      ...formData,
      doc: formData.doc.replace(/\D/g, ""),
      phone: formData.phone.replace(/\D/g, ""),
    };

    setLoading(true);
    try {
      if (editingOrganization?.organizationId) {
        await organizationService.updateOrganization(
          editingOrganization.organizationId,
          payload,
        );
        showSuccess("Organização atualizada com sucesso.");
      } else {
        const validationPayload: OrganizationRequest = {
          ...payload,
          commit: false,
        };

        const { valid, validations } =
          await organizationService.validateOrganization(validationPayload);

        if (!valid && validations.length > 0) {
          const fieldMap: Record<string, keyof OrganizationRequest> = {
            name: "name",
            legalname: "legalName",
            doc: "doc",
            orgtype: "orgType",
            email: "email",
            phone: "phone",
            city: "city",
            state: "state",
            commit: "commit",
          };

          const nextErrors: Record<string, string> = {};
          validations.forEach((validation) => {
            const key = validation.field?.replace(/\s+/g, "").toLowerCase();
            const field = key ? fieldMap[key] : undefined;
            if (field) nextErrors[field] = validation.message;
          });

          if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
          }
        }

        const createResponse = await organizationService.createOrganization({
          ...payload,
          commit: true,
        });

        const organizationId =
          typeof createResponse === "string"
            ? createResponse
            : createResponse?.organizationId;

        if (!organizationId) {
          throw new Error("Nao foi possivel obter organizationId da criacao.");
        }

        const token = AuthService.getToken();
        const userId = TokenService.getUserId(token);

        if (!userId) {
          throw new Error("Nao foi possivel obter userId do usuario logado.");
        }

        await organizationService.addUserToOrganization(organizationId, {
          userId,
          profileId: 1,
          owner: true,
        });
        showSuccess("Organização criada com sucesso.");
      }
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 422) {
        setErrors({ doc: "Já existe uma organização com este CNPJ." });
        setActiveStep(0);
      } else {
        const message =
          error instanceof Error
            ? error.message
            : editingOrganization
              ? "Erro ao atualizar organizacao."
              : "Erro ao criar organizacao.";
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
    onSaved();
  };

  return (
    <>
      <StepWizardCard
        title={editingOrganization ? "Editar Organizacao" : "Criar Organizacao"}
        subtitle={steps[activeStep]}
        steps={steps}
        activeStep={activeStep}
        showBack={true}
        onBack={handleBack}
        backLabel="Voltar"
        onClose={onClose}
        disableContent={loading}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {activeStep === 0 ? (
            <>
              <TextField
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 46,
                  },
                }}
                fullWidth
                placeholder="Nome Fantasia"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                inputProps={{ maxLength: 150 }}
              />
              <TextField
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 46,
                  },
                }}
                fullWidth
                placeholder="Razao Social"
                value={formData.legalName}
                onChange={(e) => handleChange("legalName", e.target.value)}
                error={!!errors.legalName}
                helperText={errors.legalName}
                inputProps={{ maxLength: 200 }}
              />
              <TextField
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 46,
                  },
                }}
                fullWidth
                placeholder="00.000.000/0000-00"
                value={formData.doc}
                onChange={(e) => handleChange("doc", e.target.value)}
                error={!!errors.doc}
                helperText={errors.doc}
                inputProps={{ maxLength: 18 }}
              />
              <TextField
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 46,
                  },
                }}
                fullWidth
                select
                label={formData.orgType?  "" : "Tipo de Organizacao"}
                value={formData.orgType ?? ""}
                onChange={(e) => handleChange("orgType", e.target.value)}
                error={!!errors.orgType}
                helperText={errors.orgType}
              >
                {typesLoading ? (
                  <MenuItem value="" disabled>
                    Carregando...
                  </MenuItem>
                ) : (
                  organizationTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.description || type.value}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </>
          ) : (
            <>
              <TextField
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 46,
                  },
                }}
                placeholder="Email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                error={!!errors.email}
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
                placeholder="Telefone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                error={!!errors.phone}
                helperText={errors.phone}
                inputProps={{ maxLength: 17 }}
              />

              {statesError ? (
                <Alert severity="warning" sx={{ mb: 1.5 }}>
                  {statesError}
                </Alert>
              ) : null}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <TextField
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: 46,
                    },
                  }}
                  fullWidth
                  placeholder="CEP"
                  value={cep}
                  onChange={(e) => {
                    const cepFormatted = formatCEP(e.target.value);
                    const cepNumbers = cepFormatted.replace(/\D/g, "");
                    setCep(cepFormatted);
                    setCepError(null);
                    setFormData((prev) => ({
                      ...prev,
                      zipCode: cepNumbers,
                      city: cepNumbers.length === 8 ? prev.city : "",
                      state: cepNumbers.length === 8 ? prev.state : "",
                    }));
                    if (cepNumbers.length < 8) {
                      setLocationFieldsDisabled({ city: true, state: true });
                      return;
                    }
                    handleCepLookup(cepFormatted);
                  }}
                  onBlur={(e) => handleCepLookup(e.target.value)}
                  InputProps={{
                    endAdornment: cepLoading ? (
                      <CircularProgress size={16} />
                    ) : null,
                  }}
                />
                <TextField
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: 46,
                    },
                  }}
                  disabled={locationFieldsDisabled.city}
                  fullWidth
                  placeholder="Cidade"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  error={!!errors.city}
                  helperText={errors.city}
                  inputProps={{ maxLength: 100 }}
                />
                <TextField
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: 46,
                    },
                  }}
                  fullWidth
                  select
                  placeholder="UF"
                  disabled={locationFieldsDisabled.state}
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  error={!!errors.state}
                  helperText={errors.state}
                >
                  <MenuItem value="" disabled>
                    {statesLoading ? "Carregando..." : "Selecione o estado"}
                  </MenuItem>
                  {states.map((state) => (
                    <MenuItem key={state.sigla} value={state.sigla}>
                      {state.sigla}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              {cepError ? (
                <Alert severity="warning" sx={{ mt: 1.5 }}>
                  {cepError}
                </Alert>
              ) : null}
            </>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 2,
            pt: 2,
          }}
        >
          {activeStep === 0 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
              sx={{ textTransform: "none" }}
            >
              Avançar
            </Button>
          ) : (
            <Button
              sx={{
                textTransform: "none",
                backgroundColor: loading ? "#ddd" : "#1976d2",
              }}
              variant="contained"
              onClick={loading ? () => {} : handleSubmit}
            >
              {loading ? (
                <CircularProgress size={20} />
              ) : editingOrganization ? (
                "Concluir"
              ) : (
                "Concluir"
              )}
            </Button>
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
        onConfirm={handleModalClose}
        onClose={handleModalClose}
        showCancel={false}
      />
    </>
  );
};

export default OrganizacaoForm;
