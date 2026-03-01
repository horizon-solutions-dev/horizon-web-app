import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
} from '@mui/material';
import { notify } from '../../shared/utils/toastMessage';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const initialForm: ContactForm = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

const steps = ['Seus dados', 'Mensagem', 'Revisao'];

export default function FaleConosco() {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<ContactForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const handleChange = (field: keyof ContactForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number) => {
    const nextErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.name.trim()) nextErrors.name = 'Nome e obrigatorio';
      if (!formData.email.trim()) nextErrors.email = 'Email e obrigatorio';
    }

    if (step === 1) {
      if (!formData.subject.trim()) nextErrors.subject = 'Assunto e obrigatorio';
      if (!formData.message.trim()) nextErrors.message = 'Mensagem e obrigatoria';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(1)) {
      setActiveStep(1);
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      notify({ message: 'Mensagem enviada com sucesso!', type: 'success' });
      setFormData(initialForm);
      setActiveStep(0);
    } catch {
      notify({ message: 'Erro ao enviar mensagem.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="page-container" sx={{ py: 4 }}>
      <Container maxWidth="xl">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Fale Conosco
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Envie suas duvidas, sugestoes ou solicitacoes.
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 ? (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 46,
                  },
                }}
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                fullWidth
              />
              <TextField
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 46,
                  },
                }}
                placeholder="Email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                fullWidth
              />
              <TextField
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 46,
                  },
                }}
                placeholder="Telefone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                fullWidth
              />
            </Box>
          ) : null}

          {activeStep === 1 ? (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 46,
                  },
                }}
                placeholder="Assunto"
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                error={!!errors.subject}
                helperText={errors.subject}
                fullWidth
              />
              <TextField
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 46,
                  },
                }}
                placeholder="Mensagem"
                value={formData.message}
                onChange={(e) => handleChange('message', e.target.value)}
                error={!!errors.message}
                helperText={errors.message}
                fullWidth
                multiline
                minRows={4}
              />
            </Box>
          ) : null}

          {activeStep === 2 ? (
            <Box sx={{ display: 'grid', gap: 1 }}>
              <Typography variant="subtitle2">Nome: {formData.name || '-'}</Typography>
              <Typography variant="subtitle2">Email: {formData.email || '-'}</Typography>
              <Typography variant="subtitle2">Telefone: {formData.phone || '-'}</Typography>
              <Typography variant="subtitle2">Assunto: {formData.subject || '-'}</Typography>
              <Typography variant="subtitle2">Mensagem: {formData.message || '-'}</Typography>
            </Box>
          ) : null}

          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <Button
              variant="outlined"
              disabled={activeStep === 0 || loading}
              onClick={handleBack}
            >
              Voltar
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'Enviar'}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Avançar
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
