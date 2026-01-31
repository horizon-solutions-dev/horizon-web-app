import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  unitResidentService,
  type CondominiumUnitResident,
  type CondominiumUnitResidentRequest,
} from '../../services/unitResidentService';
import StepWizardCard from '../../shared/components/StepWizardCard';

const initialForm: CondominiumUnitResidentRequest = {
  condominiumUnitId: '',
  userId: '',
  unitType: 'Owner',
  startDate: '',
  endDate: '',
  billingContact: false,
  canVote: false,
  canMakeReservations: false,
  hasGatehouseAccess: false,
};

const Residentes: React.FC = () => {
  const [formData, setFormData] = useState<CondominiumUnitResidentRequest>(initialForm);
  const [unitIdQuery, setUnitIdQuery] = useState('');
  const [residents, setResidents] = useState<CondominiumUnitResident[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const steps = ['Dados do residente', 'Periodo', 'Permissoes'];

  const handleChange = (field: keyof CondominiumUnitResidentRequest, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const loadResidents = async () => {
    if (!unitIdQuery.trim()) {
      setListError('Informe o CondominiumUnitId para carregar os residentes.');
      return;
    }

    setListLoading(true);
    setListError(null);
    try {
      const data = await unitResidentService.getResidents(unitIdQuery.trim());
      setResidents(data ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar residentes.';
      setListError(message);
    } finally {
      setListLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.condominiumUnitId || !formData.userId) {
      setSnackbar({
        open: true,
        message: 'Preencha CondominiumUnitId e UserId.',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      await unitResidentService.createResident(formData);
      setSnackbar({
        open: true,
        message: 'Residente criado com sucesso.',
        severity: 'success',
      });
      setFormData(initialForm);
      setActiveStep(0);
      if (unitIdQuery.trim()) {
        await loadResidents();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar residente.';
      setSnackbar({
        open: true,
        message,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="page-container" sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Residentes
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              label="CondominiumUnitId (consulta)"
              value={unitIdQuery}
              onChange={(e) => setUnitIdQuery(e.target.value)}
              fullWidth
            />
            <Button variant="outlined" onClick={loadResidents} disabled={listLoading}>
              {listLoading ? <CircularProgress size={20} /> : 'Carregar residentes'}
            </Button>
          </Box>

          {listError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {listError}
            </Alert>
          ) : null}

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Id</TableCell>
                <TableCell>UserId</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Inicio</TableCell>
                <TableCell>Fim</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {residents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>Nenhum residente carregado.</TableCell>
                </TableRow>
              ) : (
                residents.map((resident) => (
                  <TableRow key={resident.condominiumUnitResidentId}>
                    <TableCell>{resident.condominiumUnitResidentId}</TableCell>
                    <TableCell>{resident.userId}</TableCell>
                    <TableCell>{resident.unitType}</TableCell>
                    <TableCell>{resident.startDate || '-'}</TableCell>
                    <TableCell>{resident.endDate || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>

        <StepWizardCard
          title="Criar residente"
          subtitle={steps[activeStep]}
          steps={steps}
          activeStep={activeStep}
          showBack={activeStep > 0 && activeStep < steps.length - 1}
          onBack={() => setActiveStep((prev) => prev - 1)}
        >

          {activeStep === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="CondominiumUnitId"
                value={formData.condominiumUnitId}
                onChange={(e) => handleChange('condominiumUnitId', e.target.value)}
                fullWidth
              />
              <TextField
                label="UserId"
                value={formData.userId}
                onChange={(e) => handleChange('userId', e.target.value)}
                fullWidth
              />
              <TextField
                label="Tipo da Unidade"
                select
                value={formData.unitType || ''}
                onChange={(e) => handleChange('unitType', e.target.value)}
                fullWidth
              >
                <MenuItem value="Owner">Proprietario</MenuItem>
                <MenuItem value="Tenant">Inquilino</MenuItem>
              </TextField>
            </Box>
          ) : null}

          {activeStep === 1 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Inicio"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={formData.startDate || ''}
                onChange={(e) => handleChange('startDate', e.target.value)}
                fullWidth
              />
              <TextField
                label="Fim"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={formData.endDate || ''}
                onChange={(e) => handleChange('endDate', e.target.value)}
                fullWidth
              />
            </Box>
          ) : null}

          {activeStep === 2 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(formData.billingContact)}
                      onChange={(e) => handleChange('billingContact', e.target.checked)}
                    />
                  }
                  label="Contato de cobranca"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(formData.canVote)}
                      onChange={(e) => handleChange('canVote', e.target.checked)}
                    />
                  }
                  label="Pode votar"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(formData.canMakeReservations)}
                      onChange={(e) => handleChange('canMakeReservations', e.target.checked)}
                    />
                  }
                  label="Pode reservar"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(formData.hasGatehouseAccess)}
                      onChange={(e) => handleChange('hasGatehouseAccess', e.target.checked)}
                    />
                  }
                  label="Acesso portaria"
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="subtitle2">
                  Unidade: {formData.condominiumUnitId || '-'}
                </Typography>
                <Typography variant="subtitle2">Usuario: {formData.userId || '-'}</Typography>
                <Typography variant="subtitle2">Tipo: {formData.unitType || '-'}</Typography>
                <Typography variant="subtitle2">Inicio: {formData.startDate || '-'}</Typography>
                <Typography variant="subtitle2">Fim: {formData.endDate || '-'}</Typography>
              </Box>
            </Box>
          ) : null}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
            {activeStep === steps.length - 1 ? (
              <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'Criar residente'}
              </Button>
            ) : (
              <Button variant="contained" onClick={() => setActiveStep((prev) => prev + 1)}>
                Proximo
              </Button>
            )}
          </Box>
        </StepWizardCard>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Residentes;
