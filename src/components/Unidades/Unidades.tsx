import React, { useEffect, useState } from 'react';
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
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  unitService,
  type CondominiumUnit,
  type CondominiumUnitRequest,
  type UnitTypeEnum,
} from '../../services/unitService';

const initialForm: CondominiumUnitRequest = {
  condominiumId: '',
  condominiumBlockId: '',
  unitCode: '',
  unitType: 'Owner',
};

const Unidades: React.FC = () => {
  const [formData, setFormData] = useState<CondominiumUnitRequest>(initialForm);
  const [condominiumIdQuery, setCondominiumIdQuery] = useState('');
  const [units, setUnits] = useState<CondominiumUnit[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitTypeEnum[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [typesLoading, setTypesLoading] = useState(false);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const steps = ['Dados da unidade', 'Revisao'];

  const handleChange = (field: keyof CondominiumUnitRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const loadUnits = async () => {
    if (!condominiumIdQuery.trim()) {
      setListError('Informe o CondominiumId para carregar as unidades.');
      return;
    }

    setListLoading(true);
    setListError(null);
    try {
      const data = await unitService.getUnitsByCondominium(condominiumIdQuery.trim());
      setUnits(data ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar unidades.';
      setListError(message);
    } finally {
      setListLoading(false);
    }
  };

  const loadUnitTypes = async () => {
    setTypesLoading(true);
    setTypesError(null);
    try {
      const data = await unitService.getUnitTypes();
      setUnitTypes(data ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar tipos de unidade.';
      setTypesError(message);
    } finally {
      setTypesLoading(false);
    }
  };

  useEffect(() => {
    loadUnitTypes();
  }, []);

  const handleEdit = (unit: CondominiumUnit) => {
    setEditingId(unit.condominiumUnitId);
    setFormData({
      condominiumId: unit.condominiumId,
      condominiumBlockId: unit.condominiumBlockId,
      unitCode: unit.unitCode,
      unitType: unit.unitType || 'Owner',
    });
    setActiveStep(0);
  };

  const handleSubmit = async () => {
    if (!formData.condominiumId || !formData.condominiumBlockId || !formData.unitCode) {
      setSnackbar({
        open: true,
        message: 'Preencha CondominiumId, CondominiumBlockId e Codigo da unidade.',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await unitService.updateUnit(editingId, formData);
        setSnackbar({
          open: true,
          message: 'Unidade atualizada com sucesso.',
          severity: 'success',
        });
      } else {
        await unitService.createUnit(formData);
        setSnackbar({
          open: true,
          message: 'Unidade criada com sucesso.',
          severity: 'success',
        });
      }

      setFormData(initialForm);
      setEditingId(null);
      if (condominiumIdQuery.trim()) {
        await loadUnits();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar unidade.';
      setSnackbar({
        open: true,
        message,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderUnitTypeOptions = () => {
    if (typesLoading) {
      return (
        <MenuItem value={formData.unitType} disabled>
          Carregando...
        </MenuItem>
      );
    }

    if (unitTypes.length > 0) {
      return unitTypes.map((type) => (
        <MenuItem key={type.id} value={type.value}>
          {type.description || type.value}
        </MenuItem>
      ));
    }

    return (
      <>
        <MenuItem value="Owner">Proprietario</MenuItem>
        <MenuItem value="Tenant">Inquilino</MenuItem>
      </>
    );
  };

  const renderStepContent = () => {
    if (activeStep === 0) {
      return (
        <Box sx={{ display: 'grid', gap: 2 }}>
          <TextField
            label="CondominiumId"
            value={formData.condominiumId}
            onChange={(e) => handleChange('condominiumId', e.target.value)}
            fullWidth
          />
          <TextField
            label="CondominiumBlockId"
            value={formData.condominiumBlockId}
            onChange={(e) => handleChange('condominiumBlockId', e.target.value)}
            fullWidth
          />
          <TextField
            label="Codigo da Unidade"
            value={formData.unitCode}
            onChange={(e) => handleChange('unitCode', e.target.value)}
            fullWidth
          />
          <TextField
            label="Tipo da Unidade"
            select
            value={formData.unitType || ''}
            onChange={(e) => handleChange('unitType', e.target.value)}
            fullWidth
          >
            {renderUnitTypeOptions()}
          </TextField>
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'grid', gap: 1 }}>
        <Typography variant="subtitle2">CondominiumId: {formData.condominiumId || '-'}</Typography>
        <Typography variant="subtitle2">
          CondominiumBlockId: {formData.condominiumBlockId || '-'}
        </Typography>
        <Typography variant="subtitle2">Codigo: {formData.unitCode || '-'}</Typography>
        <Typography variant="subtitle2">Tipo: {formData.unitType || '-'}</Typography>
      </Box>
    );
  };

  return (
    <Box className="page-container" sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Unidades
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              label="CondominiumId (consulta)"
              value={condominiumIdQuery}
              onChange={(e) => setCondominiumIdQuery(e.target.value)}
              fullWidth
            />
            <Button variant="outlined" onClick={loadUnits} disabled={listLoading}>
              {listLoading ? <CircularProgress size={20} /> : 'Carregar unidades'}
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
                <TableCell>Codigo</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>CondominiumId</TableCell>
                <TableCell>BlockId</TableCell>
                <TableCell>Acoes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {units.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>Nenhuma unidade carregada.</TableCell>
                </TableRow>
              ) : (
                units.map((unit) => (
                  <TableRow key={unit.condominiumUnitId}>
                    <TableCell>{unit.condominiumUnitId}</TableCell>
                    <TableCell>{unit.unitCode}</TableCell>
                    <TableCell>{unit.unitType}</TableCell>
                    <TableCell>{unit.condominiumId}</TableCell>
                    <TableCell>{unit.condominiumBlockId}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => handleEdit(unit)}>
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>

        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {editingId ? 'Editar unidade' : 'Nova unidade'}
          </Typography>
          {typesError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {typesError}
            </Alert>
          ) : null}
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent()}

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              variant="outlined"
              disabled={activeStep === 0 || loading}
              onClick={() => setActiveStep((prev) => prev - 1)}
            >
              Voltar
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : editingId ? 'Atualizar' : 'Criar'}
              </Button>
            ) : (
              <Button variant="contained" onClick={() => setActiveStep((prev) => prev + 1)}>
                Proximo
              </Button>
            )}
            {editingId ? (
              <Button
                variant="outlined"
                onClick={() => {
                  setEditingId(null);
                  setFormData(initialForm);
                  setActiveStep(0);
                }}
              >
                Cancelar
              </Button>
            ) : null}
          </Box>
        </Paper>
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

export default Unidades;
