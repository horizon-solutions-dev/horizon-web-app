import { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
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
import {
  ApartmentOutlined,
  TuneOutlined,
  PhotoOutlined,
} from "@mui/icons-material";
import {
  condominiumService,
  type Condominium,
  type CondominiumRequest,
  type CondominiumTypeEnum,
  type AllocationTypeEnum,
} from "../../services/condominiumService";
import { condominiumImageService } from "../../services/condominiumImageService";
import { organizationService } from "../../services/organizationService";
import StepWizardCard from "../../shared/components/StepWizardCard";
import { desabilitarCampos } from "../../shared/utils/desabilitarCampos";
import { notify } from "../../shared/utils/toastMessage";

interface CondominioFormProps {
  open: boolean;
  editingCondominium: Condominium | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  onNotify: (
    message: string,
    severity?: "success" | "error" | "info" | "warning",
  ) => void;
  condominiumTypes: CondominiumTypeEnum[];
  typesLoading: boolean;
  typesError: string | null;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const CondominioForm: React.FC<CondominioFormProps> = ({
  open,
  editingCondominium,
  onClose,
  onSaved,
  onNotify,
  condominiumTypes,
  typesLoading,
  typesError,
  loading,
  setLoading,
}) => {
  const initialFormData: CondominiumRequest = {
    organizationId: localStorage.getItem("organizationId") || "",
    name: "",
    doc: "",
    address: "",
    addressNumber: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    condominiumType: 1,
    unitCount: 0,
    hasBlocks: false,
    hasWaterIndividual: false,
    hasPowerByBlock: false,
    hasGasByBlock: false,
    allocationType: 1,
    allocationValuePerc: 0,
    commit: true,
  };

  const [activeStep, setActiveStep] = useState(0);
  const [allocationTypes, setAllocationTypes] = useState<AllocationTypeEnum[]>(
    [],
  );
  const [allocationLoading, setAllocationLoading] = useState(false);
  const [allocationError, setAllocationError] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CondominiumRequest>(initialFormData);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [addressFieldsDisabled, setAddressFieldsDisabled] = useState({
    address: true,
    neighborhood: true,
    city: true,
    state: true,
    addressNumber: true,
    complement: true,
  });

  const steps = ["Informações Básicas", "Endereço", "Configurações e Rateio"];

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

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length === 0) return "";
    if (numbers.length <= 5) return numbers;
    return numbers.replace(/(\d{5})(\d+)/, "$1-$2");
  };

  const loadAllocationTypes = async () => {
    setAllocationLoading(true);
    setAllocationError(null);
    try {
      const data = await condominiumService.getAllocationTypes();
      setAllocationTypes(data ?? []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao carregar tipos de alocação.";
      setAllocationError(message);
      onNotify(message, "error");
    } finally {
      setAllocationLoading(false);
    }
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

  useEffect(() => {
    loadAllocationTypes();
  }, []);

  useEffect(() => {
    if (!open) return;
    setActiveStep(0);
    setErrors({});
    setCepError(null);
    setCoverFile(null);
    ensureOrganizationId();
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
        address: editingCondominium.address,
        addressNumber: editingCondominium.addressNumber,
        complement: editingCondominium.complement,
        neighborhood: editingCondominium.neighborhood,
        city: editingCondominium.city,
        state: editingCondominium.state,
        zipCode: formatCEP(editingCondominium.zipCode || ""),
        condominiumType: normalizeCondominiumTypeValue(
          editingCondominium.condominiumType,
        ),
        unitCount: editingCondominium.unitCount,
        hasBlocks: editingCondominium.hasBlocks,
        hasWaterIndividual: editingCondominium.hasWaterIndividual,
        hasPowerByBlock: editingCondominium.hasPowerByBlock,
        hasGasByBlock: editingCondominium.hasGasByBlock,
        allocationType: normalizeAllocationTypeValue(
          editingCondominium.allocationType,
        ),
        allocationValuePerc: editingCondominium.allocationValuePerc,
        commit: true,
      });
    } else {
      setEditingId(null);
      setFormData({
        ...initialFormData,
        organizationId: localStorage.getItem("organizationId") || "",
      });
    }
  }, [open, editingCondominium]);
  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(coverFile);
    setCoverPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [coverFile]);

  if (!open) return null;

  const handleChange = (field: string, value: unknown) => {
    let processedValue = value;

    if (field === "doc") {
      processedValue = formatCNPJ(String(value));
    } else if (field === "zipCode") {
      processedValue = formatCEP(String(value));
      const cepDigits = String(value).replace(/\D/g, "");
      if (cepDigits.length !== 8) {
        setCepError(null);
        setAddressFieldsDisabled({
          address: true,
          neighborhood: true,
          city: true,
          state: true,
          addressNumber: true,
          complement: true,
        });
      }
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep0 = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      nextErrors.name = "Nome do Condomínio é obrigatório.";
    }
    if (formData.doc.replace(/\D/g, "").length !== 14) {
      nextErrors.doc = "CNPJ inválido.";
    }
    if (!formData.condominiumType) {
      nextErrors.condominiumType = "Tipo de Condomínio é obrigatório.";
    }
    if (!formData.unitCount || formData.unitCount <= 0) {
      nextErrors.unitCount = "Quantidade de Unidades deve ser maior que 0.";
    }
    return nextErrors;
  };

  const validateStep1 = () => {
    const nextErrors: Record<string, string> = {};
    if (formData.zipCode.replace(/\D/g, "").length !== 8) {
      nextErrors.zipCode = "CEP inválido.";
    }
    if (!formData.address.trim()) {
      nextErrors.address = "Logradouro é obrigatório.";
    }
    if (!formData.addressNumber.trim()) {
      nextErrors.addressNumber = "Número é obrigatório.";
    }
    if (!formData.neighborhood.trim()) {
      nextErrors.neighborhood = "Bairro é obrigatório.";
    }
    if (!formData.city.trim()) {
      nextErrors.city = "Cidade é obrigatória.";
    }
    if (formData.state.trim().length !== 2) {
      nextErrors.state = "UF inválida.";
    }
    return nextErrors;
  };

  const validateStep2 = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.allocationType) {
      nextErrors.allocationType = "Tipo de rateio é obrigatório.";
    }
    return nextErrors;
  };

  const fieldMap: Record<string, keyof CondominiumRequest> = {
    organizationid: "organizationId",
    name: "name",
    doc: "doc",
    address: "address",
    addressnumber: "addressNumber",
    complement: "complement",
    neighborhood: "neighborhood",
    city: "city",
    state: "state",
    zipcode: "zipCode",
    condominiumtype: "condominiumType",
    unitcount: "unitCount",
    hasblocks: "hasBlocks",
    haswaterindividual: "hasWaterIndividual",
    haspowerbyblock: "hasPowerByBlock",
    hasgasbyblock: "hasGasByBlock",
    allocationtype: "allocationType",
    allocationvalueperc: "allocationValuePerc",
    commit: "commit",
  };

  const stepFields: Array<Array<keyof CondominiumRequest>> = [
    ["organizationId", "name", "doc", "condominiumType", "unitCount"],
    [
      "zipCode",
      "address",
      "addressNumber",
      "neighborhood",
      "city",
      "state",
      "complement",
    ],
    [
      "hasBlocks",
      "hasWaterIndividual",
      "hasPowerByBlock",
      "hasGasByBlock",
      "allocationType",
      "allocationValuePerc",
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

      const stepIndex = stepFields.findIndex((fields) =>
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

  const handleNext = async () => {
    let localErrors: Record<string, string> = {};
    if (activeStep === 0) {
      localErrors = validateStep0();
    } else if (activeStep === 1) {
      localErrors = validateStep1();
    }

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    try {
      setLoading(true);
      const payload: CondominiumRequest = {
        ...formData,
        doc: formData.doc.replace(/\D/g, ""),
        zipCode: formData.zipCode.replace(/\D/g, ""),
        condominiumType: normalizeCondominiumTypeValue(
          formData.condominiumType,
        ),
        allocationType: normalizeAllocationTypeValue(formData.allocationType),
        commit: false,
      };

      const { valid, validations } = editingId
        ? await condominiumService.validateCondominiumEdit(
            payload,
            editingCondominium?.condominiumId || "",
          )
        : await condominiumService.validateCondominium(payload);

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
        error instanceof Error ? error.message : "Erro ao validar condomínio.";
      onNotify(message, "error");
      return;
    } finally {
      setLoading(false);
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleCepLookup = async () => {
    const cepDigits = formData.zipCode.replace(/\D/g, "");

    if (cepDigits.length !== 8) {
      setCepError(null);

      return;
    }

    setCepLoading(true);

    setCepError(null);

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepDigits}/json/`,
      );

      const data = await response.json();

      if (data?.erro) {
        setCepError("CEP não encontrado. Preencha o endereço manualmente.");

        setAddressFieldsDisabled({
          address: false,

          neighborhood: false,

          city: false,

          state: false,

          addressNumber: false,

          complement: false,
        });

        setFormData((prev) => ({
          ...prev,
          address: "",
          neighborhood: "",
          city: "",
          state: "",
        }));

        return;
      }

      const newAddressData = {
        address: data.logradouro || "",

        neighborhood: data.bairro || "",

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

        if (newAddressData.address) delete newErrors.address;

        if (newAddressData.neighborhood) delete newErrors.neighborhood;

        if (newAddressData.city) delete newErrors.city;

        if (newAddressData.state) delete newErrors.state;

        return newErrors;
      });

      setAddressFieldsDisabled({
        address: !!data.logradouro,

        neighborhood: !!data.bairro,

        city: !!data.localidade,

        state: !!data.uf,

        addressNumber: false,

        complement: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao consultar CEP.";

      setCepError(message);

      setAddressFieldsDisabled({
        address: false,
        neighborhood: false,
        city: false,
        state: false,
        addressNumber: false,
        complement: false,
      });

      setFormData((prev) => ({
        ...prev,
        address: "",
        neighborhood: "",
        city: "",
        state: "",
      }));
    } finally {
      setCepLoading(false);
    }
  };

  const normalizeAllocationTypeValue = (value: string | number) => {
    const match = allocationTypes.find(
      (type) => type.id === value || type.value === value,
    );
    return match?.id ?? value;
  };

  const normalizeCondominiumTypeValue = (value: string | number) => {
    const match = condominiumTypes.find(
      (type) => type.id === value || type.value === value,
    );
    return match?.id ?? value;
  };

  const handleSubmit = async () => {
    const step2Errors = validateStep2();
    if (Object.keys(step2Errors).length > 0) {
      setErrors(step2Errors);
      return;
    }

    if (!formData.organizationId.trim()) {
      //onNotify("OrganizationId não encontrado.", "error");
      return;
    }

    try {
      setLoading(true);

      // Remove formatação do CNPJ e CEP antes de enviar
      const cleanDoc = formData.doc.replace(/\D/g, "");
      const cleanZipCode = formData.zipCode.replace(/\D/g, "");

      const payload: CondominiumRequest = {
        ...formData,
        doc: cleanDoc,
        zipCode: cleanZipCode,
        condominiumType: normalizeCondominiumTypeValue(
          formData.condominiumType,
        ),
        allocationType: normalizeAllocationTypeValue(formData.allocationType),
        commit: true,
      };

      // Backend validation still happens, but after local validation
      const { valid, validations } = editingId
        ? await await condominiumService.validateCondominiumEdit(
            {
              ...payload,
              commit: false,
            },
            editingCondominium?.condominiumId || "",
          )
        : await condominiumService.validateCondominium({
            ...payload,
            commit: false,
          });

      if (!valid && validations.length > 0) {
        const fieldMap: Record<string, keyof CondominiumRequest> = {
          organizationid: "organizationId",
          name: "name",
          doc: "doc",
          address: "address",
          addressnumber: "addressNumber",
          complement: "complement",
          neighborhood: "neighborhood",
          city: "city",
          state: "state",
          zipcode: "zipCode",
          condominiumtype: "condominiumType",
          unitcount: "unitCount",
          hasblocks: "hasBlocks",
          haswaterindividual: "hasWaterIndividual",
          haspowerbyblock: "hasPowerByBlock",
          hasgasbyblock: "hasGasByBlock",
          allocationtype: "allocationType",
          allocationvalueperc: "allocationValuePerc",
          commit: "commit",
        };

        const stepFields: Array<Array<keyof CondominiumRequest>> = [
          ["organizationId", "name", "doc", "condominiumType", "unitCount"],
          [
            "zipCode",
            "address",
            "addressNumber",
            "neighborhood",
            "city",
            "state",
            "complement",
          ],
          [
            "hasBlocks",
            "hasWaterIndividual",
            "hasPowerByBlock",
            "hasGasByBlock",
            "allocationType",
            "allocationValuePerc",
          ],
        ];

        const nextErrors: Record<string, string> = {};
        let targetStep = 0;

        validations.forEach((validation) => {
          const key = validation.field?.replace(/\s+/g, "").toLowerCase();
          const field = key ? fieldMap[key] : undefined;
          if (!field) return;
          nextErrors[field] = validation.message;
          const stepIndex = stepFields.findIndex((fields) =>
            fields.includes(field),
          );
          if (stepIndex >= 0) {
            targetStep = Math.max(targetStep, stepIndex);
          }
        });

        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          setActiveStep(targetStep);
          setLoading(false); // stop loading because we found validation errors
          return;
        }
      }

      const response = editingId
        ? await condominiumService.updateCondominium(editingId, payload)
        : await condominiumService.createCondominium(payload);
      if (editingId) {
        notify({
          message: `Condomínio "${formData.name}" atualizado com sucesso!`,
          type: "success",
        });
      } else
        notify({
          message: `Condomínio "${formData.name}" criado com sucesso!`,
          type: "success",
        });

      if (coverFile && response) {
        console.log({
          imageType: "Cover",
          contentFile: coverFile,
          condominiumId: response,
        });
        try {
          await condominiumImageService.uploadCondominiumImage({
            imageType: "Cover",
            contentFile: coverFile,
            condominiumId: response,
          });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Erro ao enviar imagem de capa.";
          onNotify(message, "warning");
        }
      }

      await onSaved();
      setFormData({
        ...initialFormData,
        organizationId: localStorage.getItem("organizationId") || "",
      });
      setCoverFile(null);
      setActiveStep(0);
      setEditingId(null);
      onClose();
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 422) {
        setErrors({ doc: "Já existe um condomínio com este CNPJ." });
        setActiveStep(0);
      } else {
        const message =
          error instanceof Error
            ? error.message
            : editingId
              ? "Erro ao atualizar condomínio!"
              : "Erro ao criar condomínio!";
        onNotify(message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseWizard = () => {
    setEditingId(null);
    setActiveStep(0);
    setFormData({
      ...initialFormData,
      organizationId: localStorage.getItem("organizationId") || "",
    });
    setCoverFile(null);
    setErrors({});
    setCepError(null);
    onClose();
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            <TextField
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: 46,
                  display: "flex",
                },
              }}
              fullWidth
              placeholder="Digite o nome do condomínio"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
            />
            <TextField
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: 46,
                },
              }}
              fullWidth
              value={formData.doc}
              onChange={(e) => handleChange("doc", e.target.value)}
              error={!!errors.doc}
              helperText={errors.doc}
              placeholder="00.000.000/0000-00"
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
              value={formData.condominiumType}
              onChange={(e) =>
                handleChange(
                  "condominiumType",
                  normalizeCondominiumTypeValue(e.target.value as string),
                )
              }
              error={!!errors.condominiumType}
              helperText={typesError || errors.condominiumType}
            >
              {typesLoading ? (
                <MenuItem value={formData.condominiumType} disabled>
                  Carregando...
                </MenuItem>
              ) : condominiumTypes.length > 0 ? (
                condominiumTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.description || type.value}
                  </MenuItem>
                ))
              ) : (
                <>
                  <MenuItem value="Residential">Residencial</MenuItem>
                  <MenuItem value="Commercial">Comercial</MenuItem>
                  <MenuItem value="Mixed">Misto</MenuItem>
                </>
              )}
            </TextField>
            <TextField
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: 46,
                  display: "flex",
                },
              }}
              fullWidth
              placeholder="Digite a quantidade de unidades"
              type="number"
              value={formData.unitCount || 0}
              onChange={(e) =>
                handleChange("unitCount", parseInt(e.target.value) || 0)
              }
              error={!!errors.unitCount}
              helperText={errors.unitCount}
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            <TextField
              fullWidth
              label={formData.zipCode ? "" : "CEP"}
              value={formData.zipCode}
              onChange={(e) => handleChange("zipCode", e.target.value)}
              onBlur={handleCepLookup}
              error={!!errors.zipCode || !!cepError}
              helperText={errors.zipCode || cepError}
              placeholder="00000-000"
              inputProps={{ maxLength: 9 }}
              InputProps={{
                endAdornment: cepLoading ? (
                  <CircularProgress size={18} />
                ) : null,
              }}
            />
            <TextField
              fullWidth
              disabled={addressFieldsDisabled.address}
              sx={addressFieldsDisabled.address ? desabilitarCampos : {}}
              label={formData.address ? "" : "Logradouro"}
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              error={!!errors.address}
              helperText={errors.address}
            />
            <TextField
              fullWidth
              disabled={addressFieldsDisabled.neighborhood}
              sx={addressFieldsDisabled.neighborhood ? desabilitarCampos : {}}
              label={formData.neighborhood ? "" : "Bairro"}
              value={formData.neighborhood}
              onChange={(e) => handleChange("neighborhood", e.target.value)}
              error={!!errors.neighborhood}
              helperText={errors.neighborhood}
            />
            <TextField
              fullWidth
              disabled={addressFieldsDisabled.city}
              sx={addressFieldsDisabled.city ? desabilitarCampos : {}}
              label={formData.city ? "" : "Cidade"}
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              error={!!errors.city}
              helperText={errors.city}
            />
            <TextField
              fullWidth
              disabled={addressFieldsDisabled.state}
              sx={addressFieldsDisabled.state ? desabilitarCampos : {}}
              label={formData.state ? "" : "UF"}
              value={formData.state}
              onChange={(e) =>
                handleChange("state", e.target.value.toUpperCase())
              }
              error={!!errors.state}
              helperText={errors.state}
              inputProps={{ maxLength: 2 }}
            />
            <TextField
              fullWidth
              disabled={addressFieldsDisabled.addressNumber}
              sx={addressFieldsDisabled.addressNumber ? desabilitarCampos : {}}
              label={formData.addressNumber ? "" : "Número"}
              value={formData.addressNumber}
              onChange={(e) => handleChange("addressNumber", e.target.value)}
              error={!!errors.addressNumber}
              helperText={errors.addressNumber}
            />
            <TextField
              fullWidth
              disabled={addressFieldsDisabled.complement}
              sx={addressFieldsDisabled.complement ? desabilitarCampos : {}}
              label={formData.complement ? "" : "Complemento"}
              value={formData.complement}
              onChange={(e) => handleChange("complement", e.target.value)}
              error={!!errors.complement}
              helperText={errors.complement}
            />
          </Box>
        );
      case 2:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Grid container spacing={1}>
              <Grid item xs={8} md={6}>
                <Box
                  sx={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    p: 1,
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
                      mt: "8px",
                    }}
                  >
                    <ApartmentOutlined
                      sx={{ color: "#2563eb", fontSize: 20 }}
                    />
                    <Typography
                      sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1 }}
                    >
                      Estrutura do Condomínio
                    </Typography>
                  </Box>
                  <Box sx={{ borderBottom: "1px solid #e2e8f0", mb: 1.25 }} />

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}
                  >
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <FormControlLabel
                        sx={{ height: "40px", width: "205px" }}
                        control={
                          <Checkbox
                            checked={formData.hasBlocks}
                            onChange={(e) =>
                              handleChange("hasBlocks", e.target.checked)
                            }
                            size="small"
                          />
                        }
                        label="Possui blocos"
                      />
                      <FormControlLabel
                        sx={{ height: "40px", width: "205px" }}
                        control={
                          <Checkbox
                            checked={formData.hasPowerByBlock}
                            onChange={(e) =>
                              handleChange("hasPowerByBlock", e.target.checked)
                            }
                            size="small"
                          />
                        }
                        label="Energia por bloco"
                      />
                    </Box>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      <FormControlLabel
                        sx={{ height: "40px", width: "205px" }}
                        control={
                          <Checkbox
                            checked={formData.hasGasByBlock}
                            onChange={(e) =>
                              handleChange("hasGasByBlock", e.target.checked)
                            }
                            size="small"
                          />
                        }
                        label="Gás por bloco"
                      />
                      <FormControlLabel
                        sx={{ height: "40px", width: "205px" }}
                        control={
                          <Checkbox
                            checked={formData.hasWaterIndividual}
                            onChange={(e) =>
                              handleChange(
                                "hasWaterIndividual",
                                e.target.checked,
                              )
                            }
                            size="small"
                          />
                        }
                        label="Medição individual de água"
                      />
                    </Box>
                  </Box>
                </Box>
              </Grid>

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
                    <TuneOutlined sx={{ color: "#16a34a", fontSize: 20 }} />
                    <Typography
                      sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1 }}
                    >
                      Configuração de Rateio
                    </Typography>
                  </Box>
                  <Box sx={{ borderBottom: "1px solid #e2e8f0", mb: 1.25 }} />

                  {/*     <RadioGroup
                    value={String(formData.allocationType)}
                    onChange={(e) =>
                      handleChange("allocationType", e.target.value)
                    }
                    sx={{ mb: 1, gap: 0.5 }}
                  >
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <FormControlLabel
                        sx={{ height: "40px", width: "205px" }}
                        value="FixedAllocation"
                        control={<Radio size="small" />}
                        label="Igualitário"
                      />
                      <FormControlLabel
                        sx={{ height: "40px", width: "205px" }}
                        value="ProportionalAllocation"
                        control={<Radio size="small" />}
                        label="Percentual"
                      />
                    </Box>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      <FormControlLabel
                        sx={{ height: "40px", width: "93%" }}
                        value="FractionalAllocation"
                        control={<Radio size="small" />}
                        label="Fracionário"
                      />
                      </Box>
                      </RadioGroup> */}

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      sx={{ width: "420px" }}
                      value={formData.allocationType}
                      onChange={(e) =>
                        handleChange(
                          "allocationType",
                          normalizeAllocationTypeValue(
                            e.target.value as string,
                          ),
                        )
                      }
                      error={!!errors.allocationType}
                      helperText={errors.allocationType || allocationError}
                      size="small"
                    >
                      <MenuItem value="" disabled>
                        <em>Selecione o tipo de rateio</em>
                      </MenuItem>
                      {allocationLoading ? (
                        <MenuItem
                          sx={{ width: "420px" }}
                          value={formData.allocationType}
                          disabled
                        >
                          Carregando...
                        </MenuItem>
                      ) : allocationTypes.length > 0 ? (
                        allocationTypes.map((type) => (
                          <MenuItem
                            sx={{ width: "420px" }}
                            key={type.id}
                            value={type.id}
                          >
                            {type.description || type.value}
                          </MenuItem>
                        ))
                      ) : (
                        <>
                          <MenuItem value="FractionalAllocation">
                            Rateio fracionário
                          </MenuItem>
                          <MenuItem value="FixedAllocation">
                            Rateio fixo
                          </MenuItem>
                          <MenuItem value="ProportionalAllocation">
                            Rateio proporcional
                          </MenuItem>
                        </>
                      )}
                    </TextField>
                  </Grid>
                  <TextField
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: 40,
                        mt: 1,
                        // width: "205px",
                      },
                    }}
                    fullWidth
                    placeholder="Percentual padrão (%)"
                    type="number"
                    value={formData.allocationValuePerc || ""}
                    onChange={(e) =>
                      handleChange(
                        "allocationValuePerc",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    error={!!errors.allocationValuePerc}
                    helperText={errors.allocationValuePerc}
                    inputProps={{ min: 0, max: 100, step: 0.01 }}
                  />
                  {!!errors.allocationType && (
                    <Typography
                      sx={{ color: "#d32f2f", fontSize: 12, mt: 0.5 }}
                    >
                      {errors.allocationType}
                    </Typography>
                  )}
                  {!!allocationError && (
                    <Typography
                      sx={{ color: "#d32f2f", fontSize: 12, mt: 0.25 }}
                    >
                      {allocationError}
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>

            <Box
              sx={{
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                p: 2,
                backgroundColor: "#fff",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
              >
                <PhotoOutlined sx={{ color: "#4f46e5", fontSize: 20 }} />
                <Typography
                  sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1 }}
                >
                  Imagem Fachada do Condôminio
                </Typography>
              </Box>
              <Box sx={{ borderBottom: "1px solid #e2e8f0", mb: 1 }} />

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  alignItems: { xs: "flex-start", md: "center" },
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Button
                  variant="outlined"
                  component="label"
                  size="small"
                  sx={{
                    minWidth: 152,
                    height: 38,
                    textTransform: "none",
                    fontSize: "14px",
                  }}
                >
                  Selecionar imagem
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  />
                </Button>

                <Box
                  sx={{
                    width: { xs: "100%", md: 240 },
                    height: 110,
                    borderRadius: "10px",
                    border: "1px dashed #cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    background: "#f8fafc",
                  }}
                >
                  {coverPreview ? (
                    <Box
                      component="img"
                      src={coverPreview}
                      alt="Prévia da imagem do condomínio"
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
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
              </Box>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <StepWizardCard
        title={editingId ? "Editar condomínio" : "Criar condomínio"}
        subtitle={steps[activeStep]}
        steps={steps}
        onClose={handleCloseWizard}
        activeStep={activeStep}
        showBack={activeStep > 0 && activeStep < steps.length}
        onBack={handleBack}
        width={activeStep === 2 ? "1000px" : "650px"}
        disableContent={loading}
      >
        <div className="condominio-form">{renderStepContent(activeStep)}</div>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 2,
            mt: 1.5,
            pt: 1.5,
          }}
        >
          {activeStep === steps.length - 1 ? (
            <Button
              sx={{ textTransform: "none" }}
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : "Concluir"}
            </Button>
          ) : (
            <Button
              sx={{ textTransform: "none" }}
              variant="contained"
              onClick={handleNext}
              disabled={loading}
            >
              Avançar
            </Button>
          )}
        </Box>
      </StepWizardCard>
    </>
  );
};

export default CondominioForm;
