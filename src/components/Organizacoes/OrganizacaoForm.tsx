import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import StepWizardCard from "../../shared/components/StepWizardCard";
import {
  organizationService,
  type Organization,
  type OrganizationRequest,
  type OrganizationTypeEnum,
} from "../../services/organizationService";
import { AuthService } from "../../services/authService";
import { TokenService } from "../../services/tokenService";
import "./Organizacoes.scss";
import { desabilitarCampos } from "../../shared/utils/desabilitarCampos";

interface OrganizacaoFormProps {
  open: boolean;
  editingOrganization: Organization | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  onNotify: (
    message: string,
    severity?: "success" | "error" | "info" | "warning",
  ) => void;
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
  onNotify,
  organizationTypes,
  typesLoading,
  loading,
  setLoading,
}) => {
  const steps = ["Informacoes iniciais", "Contato e Endereço"];
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<OrganizationRequest>(initialForm);
  const [cep, setCep] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [locationFieldsDisabled, setLocationFieldsDisabled] = useState(true);
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
    setLocationFieldsDisabled(true);

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
      setLocationFieldsDisabled(true);
      return;
    }

    setCepLoading(true);
    setCepError(null);
    setLocationFieldsDisabled(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (data?.erro) {
        setCepError("CEP nao encontrado.");
        setFormData((prev) => ({ ...prev, city: "", state: "" }));
        setLocationFieldsDisabled(false);
        return;
      }
      const nextCity = data.localidade || "";
      const nextState = data.uf || "";

      setFormData((prev) => ({
        ...prev,
        city: nextCity || prev.city,
        state: nextState || prev.state,
      }));

      if (nextCity || nextState) {
        setErrors((prev) => {
          const nextErrors = { ...prev };
          if (nextCity) delete nextErrors.city;
          if (nextState) delete nextErrors.state;
          return nextErrors;
        });
      }
      setLocationFieldsDisabled(true);
    } catch {
      setCepError("Erro ao consultar CEP.");
      setLocationFieldsDisabled(false);
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
        onNotify("Organizacao atualizada com sucesso.", "success");
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
        onNotify("Organizacao criada com sucesso.", "success");
      }

      await onSaved();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : editingOrganization
            ? "Erro ao atualizar organizacao."
            : "Erro ao criar organizacao.";
      onNotify(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepWizardCard
      title={editingOrganization ? "Editar Organizacao" : "Criar Organizacao"}
      subtitle={steps[activeStep]}
      steps={steps}
      activeStep={activeStep}
      showBack={true}
      onBack={handleBack}
      backLabel="Voltar"
      onClose={onClose}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {activeStep === 0 ? (
          <>
            <TextField
              fullWidth
              placeholder="Nome Fantasia"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              size="small"
              inputProps={{ maxLength: 150 }}
            />
            <TextField
              fullWidth
              placeholder="Razao Social"
              value={formData.legalName}
              onChange={(e) => handleChange("legalName", e.target.value)}
              error={!!errors.legalName}
              helperText={errors.legalName}
              size="small"
              inputProps={{ maxLength: 200 }}
            />
            <TextField
              fullWidth
              placeholder="00.000.000/0000-00"
              value={formData.doc}
              onChange={(e) => handleChange("doc", e.target.value)}
              error={!!errors.doc}
              helperText={errors.doc}
              size="small"
              inputProps={{ maxLength: 18 }}
            />
            <TextField
              fullWidth
              select
              label="Tipo de Organizacao"
              value={formData.orgType ?? ""}
              onChange={(e) => handleChange("orgType", e.target.value)}
              error={!!errors.orgType}
              helperText={errors.orgType}
              size="small"
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
            <Box sx={{ border: "1px solid #e8edf3", borderRadius: 2, p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                Contato
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    error={!!errors.email}
                    helperText={errors.email}
                    size="small"
                    inputProps={{ maxLength: 254 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Telefone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    error={!!errors.phone}
                    helperText={errors.phone}
                    size="small"
                    inputProps={{ maxLength: 17 }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ border: "1px solid #e8edf3", borderRadius: 2, p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                Localização
              </Typography>
              {statesError ? (
                <Alert severity="warning" sx={{ mb: 1.5 }}>
                  {statesError}
                </Alert>
              ) : null}
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <TextField
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
                        setLocationFieldsDisabled(true);
                        return;
                      }
                      handleCepLookup(cepFormatted);
                    }}
                    onBlur={(e) => handleCepLookup(e.target.value)}
                    size="small"
                    InputProps={{
                      endAdornment: cepLoading ? (
                        <CircularProgress size={16} />
                      ) : null,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <TextField
                      disabled={locationFieldsDisabled}
                      fullWidth
                      sx={desabilitarCampos}
                      placeholder="Cidade"
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      error={!!errors.city}
                      helperText={errors.city}
                      size="small"
                      inputProps={{ maxLength: 100 }}
                    />
                    <Box
                      sx={{
                        width: "75px",
                      }}
                    >
                      <TextField
                        sx={desabilitarCampos}
                        fullWidth
                        select
                        disabled={locationFieldsDisabled}
                        label="UF"
                        value={formData.state}
                        onChange={(e) => handleChange("state", e.target.value)}
                        error={!!errors.state}
                        helperText={errors.state}
                        size="small"
                      >
                        <MenuItem value="" disabled>
                          {statesLoading
                            ? "Carregando..."
                            : "Selecione o estado"}
                        </MenuItem>
                        {states.map((state) => (
                          <MenuItem key={state.sigla} value={state.sigla}>
                            {state.sigla}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}></Grid>
              </Grid>
              {cepError ? (
                <Alert severity="warning" sx={{ mt: 1.5 }}>
                  {cepError}
                </Alert>
              ) : null}
            </Box>
          </>
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 2,
          pt: 2,
          borderTop: "2px solid #f0f2f5",
        }}
      >
        {activeStep === 0 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
            sx={{ textTransform: "none" }}
          >
            Próximo
          </Button>
        ) : (
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <CircularProgress size={20} />
            ) : editingOrganization ? (
              ""
            ) : (
              "Criar"
            )}
          </Button>
        )}
      </Box>
    </StepWizardCard>
  );
};

export default OrganizacaoForm;
