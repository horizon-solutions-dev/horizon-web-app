import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { FileUploadOutlined } from "@mui/icons-material";
import StepWizardCard from "../../shared/components/StepWizardCard";
import "./Moradores.scss";

export interface Morador {
  id?: string;
  nome: string;
  cpf: string;
  unidade: string;
  telefone: string;
  email: string;
  foto?: string | null;
  status: "ativo" | "inativo";
}

export interface MoradorCreatePayload {
  name: string;
  surname: string;
  docType: "CPF";
  doc: string;
  email: string;
  phone: string;
  photoBase64: string | null;
  condominiumUnitId: string;
  billingContact: boolean;
  canVote: boolean;
  canMakeReservations: boolean;
  hasGatehouseAccess: boolean;
}

interface MoradorFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: MoradorCreatePayload) => Promise<void> | void;
  morador: Morador | null;
  unitIdPreset?: string;
}

type DocumentType = "CPF";

const formatCpf = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return digits.replace(/(\d{3})(\d+)/, "$1.$2");
  if (digits.length <= 9) {
    return digits.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  }
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, "$1.$2.$3-$4");
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

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Erro ao ler foto."));
    reader.readAsDataURL(file);
  });

const MoradorForm: React.FC<MoradorFormProps> = ({
  open,
  onClose,
  onSave,
  morador,
  unitIdPreset,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("CPF");
  const [documentNumber, setDocumentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isBillingContact, setIsBillingContact] = useState(true);
  const [canVote, setCanVote] = useState(true);
  const [canBook, setCanBook] = useState(true);
  const [hasGateAccess, setHasGateAccess] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;

    setActiveStep(0);
    setIsBillingContact(true);
    setCanVote(true);
    setCanBook(true);
    setHasGateAccess(true);
    setPhotoFile(null);

    if (morador) {
      const [name = "", ...rest] = (morador.nome || "").trim().split(" ");
      setFirstName(name);
      setLastName(rest.join(" "));
      setDocumentType("CPF");
      setDocumentNumber(formatCpf(morador.cpf || ""));
      setEmail(morador.email || "");
      setPhone(formatPhone(morador.telefone || ""));
    } else {
      setFirstName("");
      setLastName("");
      setDocumentType("CPF");
      setDocumentNumber("");
      setEmail("");
      setPhone("");
    }

    setErrors({});
  }, [open, morador]);

  if (!open) return null;

  const validateStepOne = () => {
    const nextErrors: Record<string, string> = {};

    if (!firstName.trim()) nextErrors.firstName = "Nome obrigatorio.";
    if (!lastName.trim()) nextErrors.lastName = "Sobrenome obrigatorio.";

    const cleanDocument = documentNumber.replace(/\D/g, "");
    if (!cleanDocument) nextErrors.documentNumber = "Documento obrigatorio.";
    if (documentType === "CPF" && cleanDocument.length !== 11) {
      nextErrors.documentNumber = "CPF invalido.";
    }

    if (!email.trim()) nextErrors.email = "Email obrigatorio.";
    if (!phone.trim()) nextErrors.phone = "Celular obrigatorio.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePrimaryAction = async () => {
    if (activeStep === 0) {
      if (!validateStepOne()) return;
      setActiveStep(1);
      return;
    }

    const photoBase64 = photoFile
      ? await fileToDataUrl(photoFile)
      : (morador?.foto ?? null);

    await onSave({
      name: firstName.trim(),
      surname: lastName.trim(),
      docType: documentType,
      doc: documentNumber.replace(/\D/g, ""),
      email: email.trim(),
      phone: phone.replace(/\D/g, ""),
      photoBase64: photoBase64,
      condominiumUnitId: unitIdPreset || "",
      billingContact: isBillingContact,
      canVote,
      canMakeReservations: canBook,
      hasGatehouseAccess: hasGateAccess,
    });
  };

  return (
    <Box className="morador-form-overlay">
      <StepWizardCard
        title={morador ? "Editar Morador" : "Criar um Morador"}
        subtitle={
          activeStep === 0 ? "Dados do Morador" : "Permissoes e Foto do Morador"
        }
        steps={["dados", "permissoes"]}
        activeStep={activeStep}
        showBack
        onBack={() => {
          if (activeStep === 0) {
            onClose();
            return;
          }
          setActiveStep(0);
        }}
        backLabel="Voltar"
        onClose={onClose}
      >
        {activeStep === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            <Grid container spacing={1.2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label={firstName ? "" : "Nome"}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  inputProps={{ maxLength: 80 }}
                  InputLabelProps={{ shrink: false }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label={lastName ? "" : "Sobrenome"}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  inputProps={{ maxLength: 120 }}
                  InputLabelProps={{ shrink: false }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="Tipo de Documento"
                  value={documentType}
                  onChange={(e) =>
                    setDocumentType(e.target.value as DocumentType)
                  }
                  InputLabelProps={{ shrink: false }}
                >
                  <MenuItem value="CPF">CPF</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label={documentNumber ? "" : "Documento"}
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(formatCpf(e.target.value))}
                  error={!!errors.documentNumber}
                  helperText={errors.documentNumber}
                  inputProps={{ maxLength: 14 }}
                  InputLabelProps={{ shrink: false }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              size="small"
              label={email ? "" : "Email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              inputProps={{ maxLength: 254 }}
              InputLabelProps={{ shrink: false }}
            />

            <TextField
              fullWidth
              size="small"
              label={phone ? "" : "Celular"}
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              error={!!errors.phone}
              helperText={errors.phone}
              inputProps={{ maxLength: 15 }}
              InputLabelProps={{ shrink: false }}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 2,
                pt: 2,
                borderTop: "2px solid #f0f2f5",
              }}
            >
              <Button
                variant="contained"
                onClick={() => void handlePrimaryAction()}
                sx={{ textTransform: "none" }}
              >
                Próximo
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            <Box sx={{ display: "flex", flexDirection: "column", mb: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isBillingContact}
                    onChange={(e) => setIsBillingContact(e.target.checked)}
                    size="small"
                  />
                }
                label="Contato da Cobranca"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={canVote}
                    onChange={(e) => setCanVote(e.target.checked)}
                    size="small"
                  />
                }
                label="Pode Votar"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={canBook}
                    onChange={(e) => setCanBook(e.target.checked)}
                    size="small"
                  />
                }
                label="Pode reservar"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hasGateAccess}
                    onChange={(e) => setHasGateAccess(e.target.checked)}
                    size="small"
                  />
                }
                label="Acesso a Portaria"
              />
            </Box>

            <Typography
              variant="subtitle2"
              sx={{
                color: "#3f4654",
                fontSize: 14,
                fontWeight: 600,
                borderBottom: "1px solid #d7dbe2",
                pb: 0.5,
              }}
            >
              Foto do Morador
            </Typography>

            <Box
              component="label"
              className="morador-photo-dropzone"
              htmlFor="morador-photo-input"
            >
              <input
                id="morador-photo-input"
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              />
              <FileUploadOutlined sx={{ fontSize: 46, color: "#7ba0d1" }} />
              <Typography sx={{ color: "#4d5562", fontSize: 16 }}>
                {photoFile ? photoFile.name : "Adicionar foto"}
              </Typography>
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
              <Button
                variant="contained"
                onClick={() => void handlePrimaryAction()}
                sx={{ textTransform: "none" }}
              >
                Criar
              </Button>
            </Box>
          </Box>
        )}
      </StepWizardCard>
    </Box>
  );
};

export default MoradorForm;
