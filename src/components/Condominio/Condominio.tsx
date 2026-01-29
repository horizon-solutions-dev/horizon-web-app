import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Snackbar,
  Alert,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { Business, CheckCircle } from '@mui/icons-material';
import { condominiumService, type Condominium, type CondominiumRequest, type CondominiumTypeEnum, type AllocationTypeEnum } from '../../services/condominiumService';
import { organizationService } from '../../services/organizationService';
import './Condominio.scss';

const CondominioForm: React.FC = () => {
  const initialFormData: CondominiumRequest = {
    organizationId: localStorage.getItem('organizationId') || '',
    name: '',
    doc: '',
    address: '',
    addressNumber: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    condominiumType: 1,
    unitCount: 0,
    hasBlocks: false,
    hasWaterIndividual: false,
    hasPowerByBlock: false,
    hasGasByBlock: false,
    allocationType: 'FractionalAllocation',
    allocationValuePerc: 0
  };

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [condominiumTypes, setCondominiumTypes] = useState<CondominiumTypeEnum[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [allocationTypes, setAllocationTypes] = useState<AllocationTypeEnum[]>([]);
  const [allocationLoading, setAllocationLoading] = useState(false);
  const [allocationError, setAllocationError] = useState<string | null>(null);
  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CondominiumRequest>(initialFormData);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const steps = ['Informações Básicas', 'Endereço', 'Configurações', 'Rateio'];

  const loadCondominiums = async () => {
    setListLoading(true);
    setListError(null);
    try {
      let organizationId = localStorage.getItem('organizationId') || '';
      if (!organizationId) {
        organizationId = await organizationService.getMyOrganizationId() || '';
        localStorage.setItem('organizationId', organizationId);
      }
      
      setFormData((prev) => ({ ...prev, organizationId }));

      const data = await condominiumService.getCondominiums(organizationId);
      setCondominiums(data ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao carregar condominios.';
      setListError(message);
    } finally {
      setListLoading(false);
    }
  };

  const loadCondominiumTypes = async () => {
    setTypesLoading(true);
    setTypesError(null);
    try {
      const data = await condominiumService.getCondominiumTypes();
      setCondominiumTypes(data ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao carregar tipos de condominio.';
      setTypesError(message);
    } finally {
      setTypesLoading(false);
    }
  };

  const loadAllocationTypes = async () => {
    setAllocationLoading(true);
    setAllocationError(null);
    try {
      const data = await condominiumService.getAllocationTypes();
      setAllocationTypes(data ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao carregar tipos de alocacao.';
      setAllocationError(message);
    } finally {
      setAllocationLoading(false);
    }
  };



  useEffect(() => {
    loadCondominiums();
    loadCondominiumTypes();
    loadAllocationTypes();
  }, []);


  const handleChange = (field: string, value: unknown) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  if (errors[field]) {
  setErrors(prev => ({ ...prev, [field]: '' }));
  }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      // Informações Básicas
      if (!formData.organizationId.trim()) newErrors.organizationId = 'Organização é obrigatória';
      if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
      if (!formData.doc.trim()) newErrors.doc = 'CNPJ é obrigatório';
      if (!formData.condominiumType) newErrors.condominiumType = 'Tipo é obrigatório';
      if (formData.unitCount <= 0) newErrors.unitCount = 'Quantidade de unidades deve ser maior que 0';
    } else if (step === 1) {
      // Endereço
      if (!formData.address.trim()) newErrors.address = 'Endereço é obrigatório';
      if (!formData.addressNumber.trim()) newErrors.addressNumber = 'Número é obrigatório';
      if (!formData.neighborhood.trim()) newErrors.neighborhood = 'Bairro é obrigatório';
      if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';
      if (!formData.state.trim()) newErrors.state = 'Estado é obrigatório';
      if (!formData.zipCode.trim()) newErrors.zipCode = 'CEP é obrigatório';
    } else if (step === 2) {
      // Configurações - sem validações obrigatórias
    } else if (step === 3) {
      // Rateio
      if (formData.allocationValuePerc < 0 || formData.allocationValuePerc > 100) {
        newErrors.allocationValuePerc = 'Percentual deve estar entre 0 e 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const getAllocationTypeLabel = (value: string | number) => {
    const match = allocationTypes.find((type) => type.id === value || type.value === value);
    return match?.description || match?.value || String(value);
  };

  const normalizeAllocationTypeValue = (value: string | number) => {
    const match = allocationTypes.find((type) => type.id === value || type.value === value);
    return match?.id ?? value;
  };

  const getCondominiumTypeLabel = (value: string | number) => {
    const match = condominiumTypes.find((type) => type.id === value || type.value === value);
    return match?.description || match?.value || String(value);
  };

  const normalizeCondominiumTypeValue = (value: string | number) => {
    const match = condominiumTypes.find((type) => type.id === value || type.value === value);
    return match?.id ?? value;
  };

  const handleEdit = (condominium: Condominium) => {
    setEditingId(condominium.condominiumId);
    setFormData({
      organizationId: condominium.organizationId,
      name: condominium.name,
      doc: condominium.doc,
      address: condominium.address,
      addressNumber: condominium.addressNumber,
      complement: condominium.complement,
      neighborhood: condominium.neighborhood,
      city: condominium.city,
      state: condominium.state,
      zipCode: condominium.zipCode,
      condominiumType: normalizeCondominiumTypeValue(condominium.condominiumType),
      unitCount: condominium.unitCount,
      hasBlocks: condominium.hasBlocks,
      hasWaterIndividual: condominium.hasWaterIndividual,
      hasPowerByBlock: condominium.hasPowerByBlock,
      hasGasByBlock: condominium.hasGasByBlock,
      allocationType: normalizeAllocationTypeValue(condominium.allocationType),
      allocationValuePerc: condominium.allocationValuePerc
    });
    setActiveStep(0);
    setIsCadastroOpen(true);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;
    if (!formData.organizationId.trim()) {
      setSnackbar({
        open: true,
        message: 'OrganizationId nao encontrado.',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      const payload: CondominiumRequest = {
        ...formData,
        condominiumType: normalizeCondominiumTypeValue(formData.condominiumType),
        allocationType: normalizeAllocationTypeValue(formData.allocationType)
      };

      if (editingId) {
        const response = await condominiumService.updateCondominium(editingId, payload);
        setSnackbar({
          open: true,
          message: `Condominio atualizado com sucesso! ID: ${response.condominiumId}`,
          severity: 'success'
        });
      } else {
        const response = await condominiumService.createCondominium(payload);
        setSnackbar({
          open: true,
          message: `Condominio criado com sucesso! ID: ${response.condominiumId}`,
          severity: 'success'
        });
      }

      await loadCondominiums();
      setFormData({
        ...initialFormData,
        organizationId: localStorage.getItem('organizationId') || ''
      });
      setActiveStep(0);
      setEditingId(null);
      setIsCadastroOpen(false);
    } catch {
      setSnackbar({
        open: true,
        message: editingId ? 'Erro ao atualizar condominio!' : 'Erro ao criar condominio!',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        // Informacoes Basicas
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome do Condominio"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CNPJ"
                value={formData.doc}
                onChange={(e) => handleChange('doc', e.target.value)}
                error={!!errors.doc}
                helperText={errors.doc}
                placeholder="00.000.000/0000-00"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tipo de Condominio"
                select
                value={formData.condominiumType}
                onChange={(e) =>
                  handleChange(
                    'condominiumType',
                    normalizeCondominiumTypeValue(e.target.value as string)
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
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Quantidade de Unidades"
                type="number"
                value={formData.unitCount}
                onChange={(e) => handleChange('unitCount', parseInt(e.target.value))}
                error={!!errors.unitCount}
                helperText={errors.unitCount}
              />
            </Grid>
          </Grid>
        );

      case 1:
        // Endereco
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Endereco (Logradouro)"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                error={!!errors.address}
                helperText={errors.address}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Numero"
                value={formData.addressNumber}
                onChange={(e) => handleChange('addressNumber', e.target.value)}
                error={!!errors.addressNumber}
                helperText={errors.addressNumber}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Complemento (Opcional)"
                value={formData.complement}
                onChange={(e) => handleChange('complement', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Bairro"
                value={formData.neighborhood}
                onChange={(e) => handleChange('neighborhood', e.target.value)}
                error={!!errors.neighborhood}
                helperText={errors.neighborhood}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cidade"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                error={!!errors.city}
                helperText={errors.city}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Estado (UF)"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value.toUpperCase())}
                error={!!errors.state}
                helperText={errors.state}
                placeholder="SP"
                inputProps={{ maxLength: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={9}>
              <TextField
                fullWidth
                label="CEP"
                value={formData.zipCode}
                onChange={(e) => handleChange('zipCode', e.target.value)}
                error={!!errors.zipCode}
                helperText={errors.zipCode}
                placeholder="00000-000"
              />
            </Grid>
          </Grid>
        );

      case 2:
        // Configuracoes
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Infraestrutura
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.hasBlocks}
                    onChange={(e) => handleChange('hasBlocks', e.target.checked)}
                  />
                }
                label="Possui Blocos"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.hasWaterIndividual}
                    onChange={(e) => handleChange('hasWaterIndividual', e.target.checked)}
                  />
                }
                label="Medicao Individual de Agua"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.hasPowerByBlock}
                    onChange={(e) => handleChange('hasPowerByBlock', e.target.checked)}
                  />
                }
                label="Energia por Bloco"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.hasGasByBlock}
                    onChange={(e) => handleChange('hasGasByBlock', e.target.checked)}
                  />
                }
                label="Gas por Bloco"
              />
            </Grid>
          </Grid>
        );

      case 3:
        // Rateio
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tipo de Rateio"
                select
                value={formData.allocationType}
                onChange={(e) =>
                  handleChange(
                    'allocationType',
                    normalizeAllocationTypeValue(e.target.value as string)
                  )
                }
                error={!!errors.allocationType}
                helperText={allocationError || errors.allocationType}
              >
                {allocationLoading ? (
                  <MenuItem value={formData.allocationType} disabled>
                    Carregando...
                  </MenuItem>
                ) : allocationTypes.length > 0 ? (
                  allocationTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.description || type.value}
                    </MenuItem>
                  ))
                ) : (
                  <>
                    <MenuItem value="FractionalAllocation">Rateio Fracionario</MenuItem>
                    <MenuItem value="FixedAllocation">Rateio Fixo</MenuItem>
                    <MenuItem value="ProportionalAllocation">Rateio Proporcional</MenuItem>
                  </>
                )}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Percentual de Rateio (%)"
                type="number"
                value={formData.allocationValuePerc}
                onChange={(e) => handleChange('allocationValuePerc', parseFloat(e.target.value))}
                error={!!errors.allocationValuePerc}
                helperText={errors.allocationValuePerc}
                inputProps={{ min: 0, max: 100, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Card sx={{ backgroundColor: '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    Resumo das Configuracoes:
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Nome:</strong> {formData.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Tipo:</strong> {getCondominiumTypeLabel(formData.condominiumType)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Unidades:</strong> {formData.unitCount}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Localizacao:</strong> {formData.address}, {formData.addressNumber}, {formData.city} - {formData.state}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Rateio:</strong> {getAllocationTypeLabel(formData.allocationType)} ({formData.allocationValuePerc}%)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box className="condominio-container" sx={{ py: 4 }}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Business sx={{ fontSize: 40, color: '#1976d2' }} />
            <Typography variant="h4" fontWeight="bold">
              {editingId ? 'Editar Condominio' : 'Criar Condominio'}
            </Typography>
          </Box>

          {!isCadastroOpen ? (
            <>
              <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Condominios da organizacao
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => {
                    setActiveStep(0);
                    setEditingId(null);
                    setFormData({ ...initialFormData, organizationId: localStorage.getItem('organizationId') || '' });
                    setIsCadastroOpen(true);
                  }}
                >
                  Cadastrar condominio
                </Button>
              </Box>

              <Paper variant="outlined" sx={{ mb: 4, p: 2 }}>
                {listLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2">Carregando...</Typography>
                  </Box>
                ) : listError ? (
                  <Alert severity="error">{listError}</Alert>
                ) : condominiums.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Nenhum condominio encontrado para esta organizacao.
                  </Typography>
                ) : (
                  <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                    <Box component="thead">
                      <Box component="tr" sx={{ textAlign: 'left' }}>
                        <Box component="th" sx={{ p: 1 }}>Nome</Box>
                        <Box component="th" sx={{ p: 1 }}>Cidade</Box>
                        <Box component="th" sx={{ p: 1 }}>Estado</Box>
                        <Box component="th" sx={{ p: 1 }}>Tipo</Box>
                        <Box component="th" sx={{ p: 1 }}>Acoes</Box>
                      </Box>
                    </Box>
                    <Box component="tbody">
                      {condominiums.map((condominium) => (
                        <Box component="tr" key={condominium.condominiumId}>
                          <Box component="td" sx={{ p: 1 }}>{condominium.name}</Box>
                          <Box component="td" sx={{ p: 1 }}>{condominium.city}</Box>
                          <Box component="td" sx={{ p: 1 }}>{condominium.state}</Box>
                          <Box component="td" sx={{ p: 1 }}>{getCondominiumTypeLabel(condominium.condominiumType)}</Box>
                          <Box component="td" sx={{ p: 1 }}>
                            <Button size="small" variant="outlined" onClick={() => handleEdit(condominium)}>
                              Editar
                            </Button>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>
            </>
          ) : null}

          {isCadastroOpen ? (
            <>
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>

                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Box sx={{ mb: 4 }}>
                {renderStepContent(activeStep)}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    disabled={loading}
                    onClick={() => {
                      setActiveStep(0);
                      setIsCadastroOpen(false);
                      setEditingId(null);
                      setFormData({ ...initialFormData, organizationId: localStorage.getItem('organizationId') || '' });
                    }}
                    variant="outlined"
                  >
                    Cancelar
                  </Button>
                  {activeStep > 0 ? (
                    <Button
                      disabled={loading}
                      onClick={handleBack}
                      variant="outlined"
                    >
                      Voltar
                    </Button>
                  ) : null}
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  {activeStep === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleSubmit}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                    >
                      {loading ? (editingId ? 'Atualizando...' : 'Criando...') : (editingId ? 'Atualizar Condominio' : 'Criar Condominio')}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                    >
                      Proximo
                    </Button>
                  )}
                </Box>
              </Box>
            </>
          ) : null}

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

export default CondominioForm;
